import React, { useState, useEffect } from 'react';
import { initialMatches } from './data/initialMatches';
import { supabase } from './lib/supabaseClient';

function App() {
  const isSupabaseConnected = true;

  // Sesión y Navegación
  const [currentTenant, setCurrentTenant] = useState(null); // { id, name }
  const [currentUser, setCurrentUser] = useState(null); // { id, username, fullName, mysticPhrase, whatsapp, isAdmin }
  const [activeTab, setActiveTab] = useState('predictions'); // 'predictions' | 'leaderboard' | 'friends' | 'admin'
  const [selectedFriendId, setSelectedFriendId] = useState(''); // ID del amigo a consultar
  const [comparisonUserId, setComparisonUserId] = useState(''); // ID para comparar resultados reales

  // Paginación de partidos
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('Todos');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Datos
  const [tenants, setTenants] = useState([]);
  const [matches, setMatches] = useState([]);
  const [participants, setParticipants] = useState([]); // Participantes del grupo
  const [predictions, setPredictions] = useState({}); // key: `${tenantId}_${participantId}`, value: { matchId: { scoreA, scoreB } }
  
  // Mensajes de humor del Top 3
  const [dailyMessages, setDailyMessages] = useState(null);

  // Modales
  const [userProfileModal, setUserProfileModal] = useState(null); // Contiene { username, fullName, mysticPhrase, whatsapp }
  const [isEditingNick, setIsEditingNick] = useState(false);
  const [newNickInput, setNewNickInput] = useState('');

  // Formularios de entrada
  const [newTenantName, setNewTenantName] = useState('');
  
  // Registro
  const [newUserName, setNewUserName] = useState(''); // Apodo
  const [newUserFullName, setNewUserFullName] = useState(''); // Nombre completo
  const [newUserMystic, setNewUserMystic] = useState(''); // Frase mística
  const [newUserWhatsapp, setNewUserWhatsapp] = useState(''); // Whatsapp (8 digitos)
  const [newUserPin, setNewUserPin] = useState(''); // PIN (4 digitos)
  const [isAdminRegister, setIsAdminRegister] = useState(false);

  // Login
  const [loginWhatsapp, setLoginWhatsapp] = useState(''); // Whatsapp (8 digitos)
  const [loginPin, setLoginPin] = useState(''); // PIN (4 digitos)

  // Carga inicial y listeners de DB
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Escuchar enlaces de invitación por URL (?invite=true&tenant=caseros2026)
  useEffect(() => {
    if (tenants.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const isInvite = params.get('invite') === 'true';
      const inviteTenantId = params.get('tenant');
      if (isInvite && inviteTenantId) {
        const foundTenant = tenants.find(t => t.id === inviteTenantId);
        if (foundTenant) {
          setCurrentTenant(foundTenant);
        } else {
          // Si no existe, lo creamos temporalmente en el estado
          const tempTenant = { id: inviteTenantId, name: inviteTenantId.replace(/-/g, ' ').toUpperCase() };
          setCurrentTenant(tempTenant);
        }
        setCurrentUser(null);
      }
    }
  }, [tenants]);

  // Cargar datos de Supabase o LocalStorage
  const fetchInitialData = async () => {
    if (isSupabaseConnected && supabase) {
      try {
        // Cargar Grupos
        let { data: dbTenants } = await supabase.from('tenants').select('*');
        setTenants(dbTenants || []);

        // Cargar Partidos
        let { data: dbMatches } = await supabase.from('matches').select('*').order('id', { ascending: true });
        if (dbMatches && dbMatches.length > 0) {
          const mappedMatches = dbMatches.map(m => ({
            id: m.id,
            teamA: m.team_a,
            flagA: m.flag_a,
            teamB: m.team_b,
            flagB: m.flag_b,
            group: m.group_name,
            date: m.match_date,
            stadium: m.stadium,
            actualScoreA: m.actual_score_a,
            actualScoreB: m.actual_score_b,
            status: m.status
          }));
          setMatches(mappedMatches);
        } else {
          const dbSeed = initialMatches.map(m => ({
            id: m.id,
            team_a: m.teamA,
            flag_a: m.flagA,
            team_b: m.teamB,
            flag_b: m.flagB,
            group_name: m.group,
            match_date: m.date,
            stadium: m.stadium,
            actual_score_a: m.actualScoreA,
            actual_score_b: m.actualScoreB,
            status: m.status
          }));
          await supabase.from('matches').insert(dbSeed);
          setMatches(initialMatches);
        }

        // Cargar Pronósticos
        let { data: dbPreds } = await supabase.from('predictions').select('*');
        const formattedPreds = {};
        dbPreds?.forEach(p => {
          const key = `${p.tenant_id}_${p.participant_id}`;
          if (!formattedPreds[key]) formattedPreds[key] = {};
          formattedPreds[key][p.match_id] = { scoreA: p.score_a, scoreB: p.score_b };
        });
        setPredictions(formattedPreds);

      } catch (err) {
        console.error("Error al conectar con Supabase:", err);
      }
    }
  };

  // Carga participantes cuando cambia el tenant seleccionado
  useEffect(() => {
    if (!currentTenant) return;
    loadParticipantsForTenant(currentTenant.id);
  }, [currentTenant]);

  const loadParticipantsForTenant = async (tenantId) => {
    if (isSupabaseConnected && supabase) {
      try {
        let { data } = await supabase.from('participants').select('*').eq('tenant_id', tenantId);
        setParticipants(data || []);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Reglas de puntuación
  const calculatePoints = (pred, actual) => {
    if (actual.status !== 'played' || actual.actualScoreA === null || actual.actualScoreB === null) {
      return 0;
    }
    if (!pred || pred.scoreA === null || pred.scoreB === null || pred.scoreA === undefined || pred.scoreB === undefined) {
      return 0;
    }

    const pA = parseInt(pred.scoreA);
    const pB = parseInt(pred.scoreB);
    const aA = parseInt(actual.actualScoreA);
    const aB = parseInt(actual.actualScoreB);

    const predOutcome = pA > pB ? 1 : pA < pB ? 2 : 0;
    const actualOutcome = aA > aB ? 1 : aA < aB ? 2 : 0;

    let points = 0;
    const outcomeMatch = predOutcome === actualOutcome;
    const exactLocal = pA === aA;
    const exactAway = pB === aB;

    if (outcomeMatch) points += 3;
    if (exactLocal) points += 1;
    if (exactAway) points += 1;
    if (outcomeMatch && exactLocal && exactAway) points += 2; // Perfect score bonus

    return points;
  };

  // Calcular tabla de posiciones
  const getLeaderboard = () => {
    const list = participants;
    const ranked = list.map(user => {
      let totalPoints = 0;
      let exactScores = 0;
      let correctOutcomes = 0;

      const userPreds = predictions[`${currentTenant.id}_${user.id}`] || {};

      matches.forEach(match => {
        if (match.status === 'played') {
          const pred = userPreds[match.id];
          const pts = calculatePoints(pred, match);
          totalPoints += pts;

          if (pts === 7) {
            exactScores += 1;
            correctOutcomes += 1;
          } else if (pts >= 3) {
            correctOutcomes += 1;
          }
        }
      });

      return {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        mysticPhrase: user.mystic_phrase,
        whatsapp: user.whatsapp,
        points: totalPoints,
        exactScores,
        correctOutcomes
      };
    });

    return ranked.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
      return a.username.localeCompare(b.username);
    });
  };

  // Generar frases del Top 3 dinámicamente
  useEffect(() => {
    if (participants.length >= 3 && matches.some(m => m.status === 'played')) {
      const board = getLeaderboard();
      if (board.length >= 3) {
        const top1 = board[0];
        const top2 = board[1];
        const top3 = board[2];

        setDailyMessages({
          first: `🏆 ¡Alabado sea el supremo líder ${top1.username}! Su Frase Mística lo dice todo: "${top1.mysticPhrase || 'El fútbol es mi vida'}". Con ${top1.points} pts miras al resto desde el Olimpo futbolístico. El mismísimo Scaloni te llamará para armar las tácticas del 2026.`,
          second: `🥈 Excelente campaña para ${top2.username}. Con ${top2.points} pts estás muy cerca del trono. Demuestras un enorme análisis futbolístico y tienes al líder sintiendo la presión en la nuca. ¡Sigue así!`,
          third: `🥉 Bueno... felicitaciones a ${top3.username} por raspar el tercer puesto. Con ${top3.points} pts lograste subir al podio, pero no te agrandes: acordate de que sos el último de los mejores. Un paso en falso y te caés al fondo de la tabla. ¡A esforzarse más!`
        });
      }
    } else {
      setDailyMessages(null);
    }
  }, [predictions, matches, participants]);

  // Crear nuevo grupo (Tenant)
  const handleCreateTenant = async (e) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;

    const id = newTenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (tenants.some(t => t.id === id)) {
      alert('Ya existe un grupo similar.');
      return;
    }

    const newTenant = { id, name: newTenantName };

    if (isSupabaseConnected && supabase) {
      try {
        await supabase.from('tenants').insert(newTenant);
      } catch (err) {
        console.error(err);
      }
    }

    const updatedTenants = [...tenants, newTenant];
    setTenants(updatedTenants);
    setNewTenantName('');
    setCurrentTenant(newTenant);
  };

  // Registrar nuevo participante
  const handleRegisterUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserFullName.trim() || !newUserWhatsapp.trim() || !newUserPin.trim() || !currentTenant) return;

    // Validar últimos 8 dígitos de whatsapp y PIN de 4 dígitos
    const cleanWhatsapp = newUserWhatsapp.replace(/\D/g, '').slice(-8);
    const cleanPin = newUserPin.replace(/\D/g, '').slice(-4);

    if (cleanWhatsapp.length !== 8) {
      alert('El número de Whatsapp debe tener al menos 8 dígitos numéricos (se guardarán los últimos 8).');
      return;
    }
    if (cleanPin.length !== 4) {
      alert('El PIN debe tener exactamente 4 dígitos numéricos.');
      return;
    }

    if (participants.some(p => p.username.toLowerCase() === newUserName.toLowerCase())) {
      alert('Este Apodo (Nickname) ya está registrado en este grupo.');
      return;
    }
    if (participants.some(p => p.whatsapp === cleanWhatsapp)) {
      alert('Este número de Whatsapp ya está registrado en este grupo de amigos.');
      return;
    }

    const newUser = {
      tenant_id: currentTenant.id,
      username: newUserName,
      full_name: newUserFullName,
      mystic_phrase: newUserMystic,
      whatsapp: cleanWhatsapp,
      pin: cleanPin,
      is_admin: isAdminRegister
    };

    if (isSupabaseConnected && supabase) {
      try {
        const { data, error } = await supabase.from('participants').insert(newUser).select();
        if (error) throw error;
        
        if (data && data.length > 0) {
          const registeredUser = data[0];
          setNewUserName('');
          setNewUserFullName('');
          setNewUserMystic('');
          setNewUserWhatsapp('');
          setNewUserPin('');
          setIsAdminRegister(false);

          setCurrentUser({
            id: registeredUser.id,
            username: registeredUser.username,
            fullName: registeredUser.full_name,
            mysticPhrase: registeredUser.mystic_phrase,
            whatsapp: registeredUser.whatsapp,
            isAdmin: registeredUser.is_admin
          });
          
          await loadParticipantsForTenant(currentTenant.id);
          setActiveTab('predictions');
        }
      } catch (err) {
        alert('Error en el registro: ' + err.message);
      }
    }
  };

  // Iniciar sesión (Whatsapp + PIN)
  const handleLoginUser = (e) => {
    e.preventDefault();
    if (!loginWhatsapp.trim() || !loginPin.trim() || !currentTenant) return;

    const cleanWhatsapp = loginWhatsapp.replace(/\D/g, '').slice(-8);
    const cleanPin = loginPin.replace(/\D/g, '').slice(-4);

    const found = participants.find(p => p.whatsapp === cleanWhatsapp && p.pin === cleanPin);
    if (!found) {
      alert('Credenciales incorrectas (Número de Whatsapp o PIN inválidos) para este grupo.');
      return;
    }

    setLoginWhatsapp('');
    setLoginPin('');
    setCurrentUser({
      id: found.id,
      username: found.username,
      fullName: found.full_name,
      mysticPhrase: found.mystic_phrase,
      whatsapp: found.whatsapp,
      isAdmin: found.is_admin
    });
    setActiveTab('predictions');
  };

  // Editar apodo
  const handleUpdateNickname = async (e) => {
    e.preventDefault();
    if (!newNickInput.trim() || !currentUser || !currentTenant) return;

    const lowerNew = newNickInput.toLowerCase();
    if (participants.some(p => p.username.toLowerCase() === lowerNew && p.id !== currentUser.id)) {
      alert('Este apodo ya está en uso por otro participante.');
      return;
    }

    const newNick = newNickInput;

    if (isSupabaseConnected && supabase) {
      try {
        const { error } = await supabase.from('participants')
          .update({ username: newNick })
          .eq('id', currentUser.id);

        if (error) throw error;

        setCurrentUser({ ...currentUser, username: newNick });
        setNewNickInput('');
        setIsEditingNick(false);
        await loadParticipantsForTenant(currentTenant.id);
        alert('Apodo actualizado con éxito.');
      } catch (err) {
        alert('Error al actualizar el apodo: ' + err.message);
      }
    }
  };

  // Guardar pronóstico individual (vinculado por ID del participante)
  const handlePredictionChange = async (matchId, team, value) => {
    if (!currentUser || !currentTenant) return;

    const parsedVal = value === '' ? '' : Math.max(0, parseInt(value) || 0);
    const key = `${currentTenant.id}_${currentUser.id}`;
    const userPreds = predictions[key] || {};
    const matchPred = userPreds[matchId] || { scoreA: '', scoreB: '' };

    const updatedPred = {
      ...matchPred,
      [team]: parsedVal
    };

    if (isSupabaseConnected && supabase) {
      try {
        await supabase.from('predictions').upsert({
          tenant_id: currentTenant.id,
          participant_id: currentUser.id,
          match_id: matchId,
          score_a: team === 'scoreA' ? parsedVal : matchPred.scoreA,
          score_b: team === 'scoreB' ? parsedVal : matchPred.scoreB,
        });

        const updatedPredictions = {
          ...predictions,
          [key]: {
            ...userPreds,
            [matchId]: updatedPred
          }
        };
        setPredictions(updatedPredictions);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Sincronizar marcadores desde JSON en Internet
  const handleSyncScores = async () => {
    try {
      const res = await fetch('/api-results.json');
      if (!res.ok) throw new Error('No se pudo descargar el feed de resultados.');
      const data = await res.json();

      const updatedMatches = matches.map(match => {
        const liveResult = data.find(r => r.id === match.id);
        if (liveResult) {
          return {
            ...match,
            actualScoreA: liveResult.actualScoreA,
            actualScoreB: liveResult.actualScoreB,
            status: liveResult.status
          };
        }
        return match;
      });

      if (isSupabaseConnected && supabase) {
        for (const item of data) {
          await supabase.from('matches')
            .update({
              actual_score_a: item.actualScoreA,
              actual_score_b: item.actualScoreB,
              status: item.status
            })
            .eq('id', item.id);
        }
      }

      setMatches(updatedMatches);
      alert('¡Resultados sincronizados de forma automática con éxito!');
    } catch (err) {
      alert('Error en la sincronización: ' + err.message);
    }
  };

  // Filtrado y paginación de partidos
  const filteredMatches = matches.filter(m => selectedGroupFilter === 'Todos' || m.group === selectedGroupFilter);
  const currentMatch = filteredMatches[currentMatchIndex] || null;

  const handleNextMatch = () => {
    if (currentMatchIndex < filteredMatches.length - 1) {
      setCurrentMatchIndex(currentMatchIndex + 1);
    }
  };

  const handlePrevMatch = () => {
    if (currentMatchIndex > 0) {
      setCurrentMatchIndex(currentMatchIndex - 1);
    }
  };

  const handleGroupFilterChange = (val) => {
    setSelectedGroupFilter(val);
    const filtered = matches.filter(m => val === 'Todos' || m.group === val);
    const firstPendingIdx = filtered.findIndex(m => m.status === 'scheduled');
    if (firstPendingIdx !== -1) {
      setCurrentMatchIndex(firstPendingIdx);
    } else {
      setCurrentMatchIndex(0);
    }
  };

  // Posicionar automáticamente en el primer partido pendiente al iniciar la app
  useEffect(() => {
    if (matches && matches.length > 0) {
      const firstPendingIdx = matches.findIndex(m => m.status === 'scheduled');
      if (firstPendingIdx !== -1) {
        setCurrentMatchIndex(firstPendingIdx);
      }
    }
  }, [matches]);

  // Generar URL de invitación
  const getInviteLink = () => {
    if (!currentTenant) return '';
    return `${window.location.origin}${window.location.pathname}?invite=true&tenant=${currentTenant.id}`;
  };

  if (!supabase) {
    return (
      <div className="onboarding-wrapper" style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
        <div className="glass-card onboarding-card text-center" style={{ borderLeft: '4px solid #ff4d4d', maxWidth: '500px' }}>
          <span style={{ fontSize: '3rem' }}>🔌</span>
          <h2 style={{ marginTop: '1rem', color: '#ff4d4d' }}>Conexión Supabase Requerida</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '1.5rem 0', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Para usar la base de datos de Supabase directamente de entrada, por favor abre el archivo <strong>.env</strong> en la raíz del proyecto y completa las siguientes variables con tus credenciales:
          </p>
          <pre style={{ background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '4px', textAlign: 'left', fontSize: '0.85rem', marginBottom: '1.5rem', overflowX: 'auto', color: '#a0aec0' }}>
            VITE_SUPABASE_URL=tu_url_aqui<br/>
            VITE_SUPABASE_ANON_KEY=tu_clave_aqui
          </pre>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Una vez guardado el archivo <strong>.env</strong>, reinicia el servidor de desarrollo (npm run dev) para aplicar los cambios.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Cabecera */}
      <header className="app-header">
        <div className="logo-container">
          <span className="logo-icon">🏆</span>
          <div>
            <h1 className="logo-text">PRODE Mundial 2026</h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Mundialista Multitenant</span>
          </div>
        </div>

        <div className="d-flex gap-2" style={{ alignItems: 'center' }}>
          {currentTenant && (
            <>
              <span className="tenant-tag">{currentTenant.name}</span>
              {currentUser && (
                <span className="user-badge" style={{ cursor: 'pointer' }} onClick={() => {
                  setNewNickInput(currentUser.username);
                  setIsEditingNick(true);
                }}>
                  👑 <strong>{currentUser.username}</strong>
                </span>
              )}
            </>
          )}
        </div>
      </header>

      {/* MODAL: Detalles del perfil */}
      {userProfileModal && (
        <div className="onboarding-wrapper" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1001 }}>
          <div className="glass-card onboarding-card text-center">
            <span style={{ fontSize: '3rem' }}>🔮</span>
            <h3 style={{ fontSize: '1.5rem', marginTop: '1rem' }}>Ficha del Participante</h3>
            <div style={{ margin: '1.5rem 0', textAlign: 'left' }}>
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Apodo</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>{userProfileModal.username}</div>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Nombre Real</div>
                <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{userProfileModal.fullName}</div>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Frase Mística</div>
                <div style={{ fontSize: '1.05rem', fontStyle: 'italic', color: '#ffb703' }}>"{userProfileModal.mysticPhrase || 'El silencio es mi estrategia'}"</div>
              </div>
            </div>
            <button className="btn-primary" onClick={() => setUserProfileModal(null)}>Cerrar</button>
          </div>
        </div>
      )}

      {/* MODAL: Modificar Apodo */}
      {isEditingNick && (
        <div className="onboarding-wrapper" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1001 }}>
          <div className="glass-card onboarding-card">
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Editar mi Apodo</h3>
            <form onSubmit={handleUpdateNickname}>
              <div className="form-group">
                <label>Nuevo Apodo / Nickname</label>
                <input
                  type="text"
                  className="form-control"
                  value={newNickInput}
                  onChange={(e) => setNewNickInput(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary">Guardar</button>
                <button type="button" className="btn-secondary" onClick={() => setIsEditingNick(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="container">
        
        {/* Paso 1: Selección de Tenant */}
        {!currentTenant && (
          <div className="onboarding-wrapper">
            <div className="glass-card onboarding-card">
              <h2 className="onboarding-title">El Prode de los Amigos</h2>
              <p className="onboarding-subtitle">Selecciona tu grupo o crea uno nuevo para empezar.</p>

              <div className="form-group">
                <label>Grupos Activos</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {tenants.map(t => (
                    <button
                      key={t.id}
                      className="btn-secondary"
                      style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onClick={() => setCurrentTenant(t)}
                    >
                      <span>🏆 {t.name}</span>
                      <span>Entrar &rarr;</span>
                    </button>
                  ))}
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1.5rem 0' }} />

              <form onSubmit={handleCreateTenant}>
                <div className="form-group">
                  <label htmlFor="tenantName">Crear un Nuevo Grupo</label>
                  <input
                    type="text"
                    id="tenantName"
                    className="form-control"
                    placeholder="Ej. Compañeros de Fútbol"
                    value={newTenantName}
                    onChange={(e) => setNewTenantName(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary">Crear Grupo</button>
              </form>
            </div>
          </div>
        )}

        {/* Paso 2: Selección/Registro de Participante */}
        {currentTenant && !currentUser && (
          <div className="onboarding-wrapper">
            <div className="glass-card onboarding-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--accent-color)' }}>🏆 {currentTenant.name}</h2>
                <button className="btn-secondary" style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => setCurrentTenant(null)}>&larr; Salir</button>
              </div>

              {/* Login */}
              <form onSubmit={handleLoginUser} style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Entrar al Juego</h3>
                <div className="form-group">
                  <label>Nro. de WhatsApp (Últimos 8 números)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. 11223344"
                    value={loginWhatsapp}
                    onChange={(e) => setLoginWhatsapp(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>PIN de Acceso (4 dígitos)</label>
                  <input
                    type="password"
                    maxLength="4"
                    className="form-control"
                    placeholder="🔑 ****"
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-secondary">Iniciar Sesión</button>
              </form>

              <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1.5rem 0' }} />

              {/* Registro */}
              <form onSubmit={handleRegisterUser}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Registrarse como Nuevo Miembro</h3>
                <div className="form-group">
                  <label>Nombre Real Completo</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Juan Carlos Gómez"
                    value={newUserFullName}
                    onChange={(e) => setNewUserFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Apodo / Nickname público</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Juani10"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Frase Mística / Inspiradora</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. ¡Elijo creer!"
                    value={newUserMystic}
                    onChange={(e) => setNewUserMystic(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Nro. de WhatsApp (Últimos 8 números)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. 11223344"
                    value={newUserWhatsapp}
                    onChange={(e) => setNewUserWhatsapp(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>PIN de 4 dígitos</label>
                  <input
                    type="password"
                    maxLength="4"
                    className="form-control"
                    placeholder="🔑 ****"
                    value={newUserPin}
                    onChange={(e) => setNewUserPin(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    id="adminCheck"
                    checked={isAdminRegister}
                    onChange={(e) => setIsAdminRegister(e.target.checked)}
                  />
                  <label htmlFor="adminCheck" style={{ textTransform: 'none', cursor: 'pointer' }}>Ser Administrador</label>
                </div>
                <button type="submit" className="btn-primary">Registrarse y Jugar</button>
              </form>
            </div>
          </div>
        )}

        {/* Paso 3: Interfaz Logueada */}
        {currentTenant && currentUser && (
          <div>
            {/* Diario y humor del Top 3 */}
            {dailyMessages && (
              <div className="glass-card mb-4 animate-fade-in" style={{ borderLeft: '4px solid var(--primary-gold)', background: 'rgba(255, 215, 0, 0.02)' }}>
                <h3 style={{ color: 'var(--primary-gold)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📢 El Diario del Prode - Ganadores del Día
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                  <p style={{ fontStyle: 'italic' }}>{dailyMessages.first}</p>
                  <p style={{ fontStyle: 'italic' }}>{dailyMessages.second}</p>
                  <p style={{ fontStyle: 'italic', color: '#ff8888' }}>{dailyMessages.third}</p>
                </div>
              </div>
            )}

            {/* Menu Tabs */}
            <nav className="tabs-navigation">
              <button className={`tab-btn ${activeTab === 'predictions' ? 'active' : ''}`} onClick={() => setActiveTab('predictions')}>
                📝 Mis Predicciones
              </button>
              <button className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
                📊 Tabla General
              </button>
              <button className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>
                👥 Ver Amigos
              </button>
              <button className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
                ⚙️ Resultados Reales
              </button>
            </nav>

            {/* PESTAÑA: Pronósticos Paginados de a 1 partido */}
            {activeTab === 'predictions' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.25rem' }}>Cargar mis pronósticos</h3>
                  <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <label style={{ margin: 0 }}>Grupo:</label>
                    <select
                      className="form-control"
                      style={{ padding: '0.4rem 1.5rem' }}
                      value={selectedGroupFilter}
                      onChange={(e) => handleGroupFilterChange(e.target.value)}
                    >
                      <option value="Todos">Todos los partidos</option>
                      <option value="Grupo A">Grupo A</option>
                      <option value="Grupo B">Grupo B</option>
                      <option value="Grupo C">Grupo C</option>
                      <option value="Grupo D">Grupo D</option>
                      <option value="Grupo E">Grupo E</option>
                      <option value="Grupo F">Grupo F</option>
                      <option value="Grupo G">Grupo G</option>
                      <option value="Grupo H">Grupo H</option>
                      <option value="Grupo I">Grupo I</option>
                    </select>
                  </div>
                </div>

                {currentMatch ? (
                  <div className="glass-card text-center" style={{ maxWidth: '550px', margin: '0 auto', padding: '2rem 1.5rem' }}>
                    <div className="match-header" style={{ justifyContent: 'center', gap: '1rem' }}>
                      <strong>{currentMatch.group}</strong> • <span>{currentMatch.date}</span>
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{currentMatch.stadium}</p>

                    {currentMatch.status === 'played' && (
                      <div style={{ color: '#ff4d4d', fontWeight: '700', fontSize: '0.9rem', marginBottom: '1rem', background: 'rgba(255, 77, 77, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>
                        🔒 Partido finalizado. Pronósticos cerrados.
                      </div>
                    )}

                    <div className="match-body" style={{ flexDirection: 'column', gap: '1.5rem' }}>
                      <div className="d-flex" style={{ width: '100%', justifyContent: 'space-around', alignItems: 'center' }}>
                        
                        {/* Team A */}
                        <div className="team-container" style={{ flex: 1 }}>
                          <span className="team-flag" style={{ fontSize: '3.5rem' }}>{currentMatch.flagA}</span>
                          <span className="team-name" style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>{currentMatch.teamA}</span>
                        </div>

                        {/* Inputs Grandes */}
                        <div className="prediction-inputs" style={{ gap: '1rem' }}>
                          <input
                            type="number"
                            min="0"
                            className="score-input"
                            style={{ width: '70px', height: '70px', fontSize: '2rem' }}
                            value={predictions[`${currentTenant.id}_${currentUser.id}`]?.[currentMatch.id]?.scoreA ?? ''}
                            onChange={(e) => handlePredictionChange(currentMatch.id, 'scoreA', e.target.value)}
                            disabled={currentMatch.status === 'played'}
                          />
                          <span className="score-separator" style={{ fontSize: '2rem' }}>-</span>
                          <input
                            type="number"
                            min="0"
                            className="score-input"
                            style={{ width: '70px', height: '70px', fontSize: '2rem' }}
                            value={predictions[`${currentTenant.id}_${currentUser.id}`]?.[currentMatch.id]?.scoreB ?? ''}
                            onChange={(e) => handlePredictionChange(currentMatch.id, 'scoreB', e.target.value)}
                            disabled={currentMatch.status === 'played'}
                          />
                        </div>

                        {/* Team B */}
                        <div className="team-container" style={{ flex: 1 }}>
                          <span className="team-flag" style={{ fontSize: '3.5rem' }}>{currentMatch.flagB}</span>
                          <span className="team-name" style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>{currentMatch.teamB}</span>
                        </div>

                      </div>
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                      {currentMatch.status === 'played' ? (
                        <div style={{ textAlign: 'left' }}>
                          <div>Resultado Oficial: <strong style={{ color: 'var(--accent-color)' }}>{currentMatch.actualScoreA} - {currentMatch.actualScoreB}</strong></div>
                          <span className="points-pill">
                            Puntos ganados: {calculatePoints(predictions[`${currentTenant.id}_${currentUser.id}`]?.[currentMatch.id], currentMatch)}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Por Jugar - Ingresa tus predicciones arriba</span>
                      )}
                    </div>

                    {/* Botones de navegación de partido */}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                      <button
                        className="btn-secondary"
                        onClick={handlePrevMatch}
                        disabled={currentMatchIndex === 0}
                      >
                        &larr; Anterior
                      </button>
                      <span style={{ alignSelf: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Partido {currentMatchIndex + 1} de {filteredMatches.length}
                      </span>
                      <button
                        className="btn-secondary"
                        onClick={handleNextMatch}
                        disabled={currentMatchIndex === filteredMatches.length - 1}
                      >
                        Siguiente &rarr;
                      </button>
                    </div>

                  </div>
                ) : (
                  <p className="text-center" style={{ color: 'var(--text-secondary)' }}>No hay partidos para el grupo seleccionado.</p>
                )}
              </div>
            )}

            {/* PESTAÑA: Tabla de Posiciones */}
            {activeTab === 'leaderboard' && (
              <div className="glass-card">
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>🏆 Clasificación del Grupo</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table className="leaderboard-table">
                    <thead>
                      <tr>
                        <th>Pos</th>
                        <th>Apodo (Nickname)</th>
                        <th style={{ textAlign: 'center' }}>Marcadores Exactos</th>
                        <th style={{ textAlign: 'right' }}>Puntos Totales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getLeaderboard().map((row, idx) => (
                        <tr key={row.id} className="leaderboard-row">
                          <td className="rank-cell">{idx + 1}º</td>
                          <td>
                            <span
                              style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--accent-color)', fontWeight: 600 }}
                              title="Haz clic para ver el perfil"
                              onClick={() => setUserProfileModal({ username: row.username, fullName: row.fullName, mysticPhrase: row.mysticPhrase, whatsapp: row.whatsapp })}
                            >
                              {row.username}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>{row.exactScores} ⭐</td>
                          <td className="points-cell">{row.points} pts</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PESTAÑA: Ver Amigos y comparar pronósticos */}
            {activeTab === 'friends' && (
              <div className="glass-card">
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>👥 Consultar Pronósticos de Amigos</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  Selecciona a uno de tus amigos para inspeccionar los pronósticos que ha guardado.
                </p>

                <div className="form-group" style={{ maxWidth: '300px', marginBottom: '2rem' }}>
                  <label>Elegir Amigo</label>
                  <select
                    className="form-control"
                    value={selectedFriendId}
                    onChange={(e) => setSelectedFriendId(e.target.value)}
                  >
                    <option value="">-- Selecciona un amigo --</option>
                    {participants.map(p => (
                      <option key={p.id} value={p.id}>{p.username} ({p.full_name || p.fullName || p.username})</option>
                    ))}
                  </select>
                </div>

                {selectedFriendId ? (
                  <div>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>
                      Pronósticos de: {participants.find(p => p.id === selectedFriendId)?.username}
                    </h3>
                    <div className="matches-grid">
                      {matches.map(m => {
                        const friendKey = `${currentTenant.id}_${selectedFriendId}`;
                        const pred = predictions[friendKey]?.[m.id];
                        const isPlayed = m.status === 'played';
                        const pts = isPlayed ? calculatePoints(pred, m) : 0;

                        return (
                          <div key={m.id} className="glass-card" style={{ padding: '1rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{m.group}</div>
                            <div className="d-flex" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>{m.flagA} {m.teamA}</span>
                              <strong style={{ fontSize: '1.2rem', padding: '0 0.5rem' }}>
                                {pred ? `${pred.scoreA} - ${pred.scoreB}` : '-'}
                              </strong>
                              <span>{m.teamB} {m.flagB}</span>
                            </div>
                            {isPlayed && (
                              <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Real: {m.actualScoreA} - {m.actualScoreB}</span>
                                <span style={{ color: 'var(--accent-color)' }}>+{pts} pts</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)' }}>Por favor, elige un amigo de la lista superior.</p>
                )}
              </div>
            )}

            {/* PESTAÑA: Resultados Reales y comparaciones */}
            {activeTab === 'admin' && (
              <div className="glass-card">
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ⚙️ Resultados Oficiales del Mundial
                </h2>
                
                {/* Generador de Invitación para el Admin */}
                {currentUser.isAdmin && (
                  <div className="glass-card mb-4" style={{ borderLeft: '4px solid var(--accent-color)', background: 'rgba(0, 255, 135, 0.02)' }}>
                    <h4 style={{ marginBottom: '0.5rem', color: 'var(--accent-color)' }}>🎫 Generar Enlace de Invitación al Grupo</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      Copia y comparte este enlace con tus amigos para que se unan directamente a este grupo de Prode:
                    </p>
                    <input
                      type="text"
                      className="form-control"
                      value={getInviteLink()}
                      readOnly
                      onClick={(e) => {
                        e.target.select();
                        navigator.clipboard.writeText(getInviteLink());
                        alert('¡Enlace de invitación copiado al portapapeles!');
                      }}
                      style={{ background: 'rgba(0,0,0,0.4)', color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 500 }}
                    />
                    <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                      💡 Haz clic en el cuadro para copiar.
                    </small>
                  </div>
                )}

                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  A continuación se muestran los marcadores de los partidos del mundial. Presiona el botón para sincronizar los resultados en tiempo real desde internet.
                </p>

                <div className="glass-card mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'rgba(255, 255, 255, 0.02)' }}>
                  <div>
                    <h4 style={{ marginBottom: '0.25rem' }}>Sincronización Automática</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fuente: /api-results.json</span>
                  </div>
                  <button className="btn-primary" style={{ width: 'auto' }} onClick={handleSyncScores}>
                    🔄 Sincronizar Resultados
                  </button>
                </div>

                {/* Comparador de resultados con un participante */}
                <div className="form-group" style={{ maxWidth: '350px', marginBottom: '2rem' }}>
                  <label>Comparar partido real con el pronóstico de:</label>
                  <select
                    className="form-control"
                    value={comparisonUserId}
                    onChange={(e) => setComparisonUserId(e.target.value)}
                  >
                    <option value="">-- No comparar / Solo ver resultados --</option>
                    {participants.map(p => (
                      <option key={p.id} value={p.id}>{p.username} ({p.full_name || p.fullName || p.username})</option>
                    ))}
                  </select>
                </div>

                <div className="matches-grid">
                  {matches.map(match => {
                    const isPlayed = match.status === 'played';
                    
                    // Obtener pronóstico de la persona seleccionada para comparar
                    const compKey = `${currentTenant.id}_${comparisonUserId}`;
                    const pred = comparisonUserId ? predictions[compKey]?.[match.id] : null;
                    const ptsEarned = (isPlayed && pred) ? calculatePoints(pred, match) : 0;

                    return (
                      <div key={match.id} className="glass-card" style={{ borderColor: isPlayed ? 'var(--accent-color)' : 'var(--glass-border)' }}>
                        <div className="match-header">
                          <span>{match.group} • {match.date}</span>
                          <span style={{ color: isPlayed ? 'var(--accent-color)' : 'var(--text-secondary)', fontWeight: 'bold' }}>
                            {isPlayed ? 'FINALIZADO' : 'PENDIENTE'}
                          </span>
                        </div>

                        <div className="match-body" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ flex: 1, textAlign: 'left' }}>{match.flagA} {match.teamA}</span>
                          
                          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '1.25rem', fontWeight: 'bold', minWidth: '80px', textAlign: 'center' }}>
                            {isPlayed ? `${match.actualScoreA} - ${match.actualScoreB}` : 'vs'}
                          </div>

                          <span style={{ flex: 1, textAlign: 'right' }}>{match.teamB} {match.flagB}</span>
                        </div>

                        {/* Mostrar comparación si hay un usuario seleccionado */}
                        {comparisonUserId && (
                          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>Pronóstico de <strong>{participants.find(p => p.id === comparisonUserId)?.username}</strong>:</span>
                              <strong style={{ fontSize: '1rem', color: pred ? 'white' : 'var(--text-secondary)' }}>
                                {pred ? `${pred.scoreA} - ${pred.scoreB}` : 'Sin cargar'}
                              </strong>
                            </div>
                            {isPlayed && pred && (
                              <div style={{ marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Puntos sumados:</span>
                                <span className={`points-pill ${ptsEarned === 7 ? 'perfect' : ptsEarned === 0 ? 'zero' : ''}`}>
                                  +{ptsEarned} pts
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cerrar Sesión y salir */}
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <button
                className="btn-secondary"
                style={{ width: 'auto', color: '#ff4d4d', borderColor: '#ff4d4d' }}
                onClick={() => {
                  setCurrentUser(null);
                  setCurrentTenant(null);
                }}
              >
                Cerrar Sesión y Cambiar de Grupo
              </button>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}

export default App;
