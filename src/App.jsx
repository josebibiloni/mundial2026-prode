import React, { useState, useEffect } from 'react';
import { initialMatches } from './data/initialMatches';
import { banterPhrases } from './data/banterPhrases';
import { soccerQuotes } from './data/soccerQuotes';
import { supabase } from './lib/supabaseClient';

const welcomeBanterPhrases = [
  "Otro que se anota para decir cómo van a salir los partidos, y es un tremendo patadura... 🩴",
  "Otro gil que se anota. ¿Pensás que vas a ganar? Ja. 😂",
  "¿Quién está invitando a esta gente??? Miren al nuevo... 🤡",
  "Acá no hay nadie que sepa de fuchibol, ¡y vos acabás de bajar el promedio! 📉",
  "Bienvenido al fondo de la tabla. Ponete cómodo que de ahí no salís. 🛋️",
  "Registrado con éxito. Tu función principal será aportar puntos fáciles para el resto. 🎁",
  "Bienvenido. Tus predicciones ya fueron registradas en la categoría 'Fantasías imposibles'. 🦄",
  "¿En serio vas a intentar predecir? Si de fútbol sabés lo mismo que de física cuántica... 🤓",
  "Llegó el experto que piensa que la pelota es cuadrada. Suerte con eso... 🩴",
  "¿Quién te dio permiso para opinar de fútbol? Poné cualquier número, total vas a errar. 📉",
  "Otro que viene a dar cátedra y no sabe lo que es un offside. Bienvenido... 🤡",
  "Tus amigos ya hicieron una vaquita para comprarte un manual de fútbol básico. 📘",
  "Ingresaste con éxito. La base de datos ya redujo tus probabilidades de acierto a cero. 🤖",
  "A ver qué verdura tirás hoy en los pronósticos. ¡Preparate para quedar último! 🏹"
];

function App() {
  const isSupabaseConnected = true;

  // Sesión y Navegación
  const [currentTenant, setCurrentTenant] = useState(null); // { id, name }
  const [currentUser, setCurrentUser] = useState(null); // { id, username, fullName, mysticPhrase, whatsapp, isAdmin, stripeColor1, stripeColor2 }
  const [activeTab, setActiveTab] = useState('predictions'); // 'predictions' | 'leaderboard' | 'friends' | 'admin'
  const [selectedFriendId, setSelectedFriendId] = useState(''); // ID del amigo a consultar
  const [comparisonUserId, setComparisonUserId] = useState(''); // ID para comparar resultados reales
  const [selectedDetailedMatchId, setSelectedDetailedMatchId] = useState(''); // ID del partido a detallar en tabla general

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
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editNickInput, setEditNickInput] = useState('');
  const [editMysticInput, setEditMysticInput] = useState('');
  const [editColor1Input, setEditColor1Input] = useState('#ff0055');
  const [editColor2Input, setEditColor2Input] = useState('#00ff87');

  // Popup de Chicanas
  const [showBanterPopup, setShowBanterPopup] = useState(false);
  const [banterMessage, setBanterMessage] = useState('');
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [welcomePopupMessage, setWelcomePopupMessage] = useState('');
  const [boludeoCooldown, setBoludeoCooldown] = useState(0); // Temporizador de cooldown

  // Duelos y Desafíos Pre-Mundial (Piedra, Papel o Tijera)
  const [duels, setDuels] = useState([]);
  const [opponentSearch, setOpponentSearch] = useState('');
  const [duelMove, setDuelMove] = useState('rock'); // 'rock' | 'paper' | 'scissors'
  const [duelChicana, setDuelChicana] = useState('');
  const [replyMove, setReplyMove] = useState('rock');
  const [replyChicana, setReplyChicana] = useState('');
  const [selectedReplyDuel, setSelectedReplyDuel] = useState(null);
  const [isRandomOpponent, setIsRandomOpponent] = useState(false);
  const [systemDuelPhrase, setSystemDuelPhrase] = useState('');
  const [activeLosingDuelId, setActiveLosingDuelId] = useState(null);
  const [loserResponseText, setLoserResponseText] = useState('');
  const [showLoserResponseModal, setShowLoserResponseModal] = useState(false);

  // Configuración de Boludeo Personalizado
  const [showSetupBoludeo, setShowSetupBoludeo] = useState(false);
  const [setupColor1, setSetupColor1] = useState('#ff0055');
  const [setupColor2, setSetupColor2] = useState('#00ff87');
  const [setupPattern, setSetupPattern] = useState('diagonal');
  const [setupPhrase, setSetupPhrase] = useState('');



  // Estado de Boludeo Activo (Efecto de 30 segundos)
  const [activeBoludeo, setActiveBoludeo] = useState(null); // { triggerer, color1, color2, phrase, message, endedAt }
  const [showBoludeoPopup, setShowBoludeoPopup] = useState(false);
  const [boludeoPopupMessage, setBoludeoPopupMessage] = useState('');
  const [boludeoPopupTriggerer, setBoludeoPopupTriggerer] = useState('');

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
          const tempTenant = { id: inviteTenantId, name: inviteTenantId.replace(/-/g, ' ').toUpperCase() };
          setCurrentTenant(tempTenant);
        }
        setCurrentUser(null);
      }
    }
  }, [tenants]);

  // Monitorear y aplicar Boludeo Activo en tiempo real
  useEffect(() => {
    if (!currentTenant || !currentUser || !supabase) return;

    let timer = null;

    const checkLatestBoludeo = async () => {
      try {
        // Consultar el último evento de boludeo para este grupo
        const { data, error } = await supabase
          .from('boludeo_events')
          .select('*')
          .eq('tenant_id', currentTenant.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          // Si la tabla no existe en supabase todavía, fallar en silencio
          return;
        }

        if (data && data.length > 0) {
          const latest = data[0];
          
          // No auto-boludearse (si fui yo quien presionó el botón, ya lo sé/no me afecta)
          if (latest.triggered_by_username === currentUser.username) {
            return;
          }

          // Comprobar si ya experimentamos este boludeo específico
          const lastExp = localStorage.getItem(`last_experienced_boludeo_${currentTenant.id}`);
          if (lastExp !== latest.created_at) {
            // Guardar que ya se empezó a experimentar
            localStorage.setItem(`last_experienced_boludeo_${currentTenant.id}`, latest.created_at);

            // Activar el efecto por 30 segundos
            setActiveBoludeo({
              triggerer: latest.triggered_by_username,
              color1: latest.stripe_color_1,
              color2: latest.stripe_color_2,
              phrase: latest.mystic_phrase,
              message: latest.message,
              pattern: latest.pattern || 'diagonal',
              endedAt: Date.now() + 30000
            });

            // Mostrar el popup
            setBoludeoPopupMessage(latest.message);
            setBoludeoPopupTriggerer(latest.triggered_by_username);
            setShowBoludeoPopup(true);

            // El efecto de fondo y marca de agua ahora se quita automáticamente mediante useEffect
          }
        }
      } catch (err) {
        console.error("Error al chequear boludeos:", err);
      }
    };

    // Consultar al inicio
    checkLatestBoludeo();

    // Polling cada 7 segundos para detectar nuevos botones presionados en tiempo real
    timer = setInterval(checkLatestBoludeo, 7000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentTenant, currentUser]);

  // Decrementar el cooldown de boludeo segundo a segundo
  useEffect(() => {
    if (boludeoCooldown <= 0) return;
    const timer = setInterval(() => {
      setBoludeoCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [boludeoCooldown]);

  // Manejar el ciclo de vida del Boludeo Activo de forma centralizada y robusta
  useEffect(() => {
    if (!activeBoludeo) return;
    const timeLeft = activeBoludeo.endedAt - Date.now();
    if (timeLeft <= 0) {
      setActiveBoludeo(null);
      return;
    }
    const timer = setTimeout(() => {
      setActiveBoludeo(null);
    }, timeLeft);
    return () => clearTimeout(timer);
  }, [activeBoludeo]);


  // Guardar configuración de boludeo localmente y en base de datos
  const handleSaveSetup = async () => {
    if (!currentUser || !currentTenant) return;

    setCurrentUser(prev => ({
      ...prev,
      stripeColor1: setupColor1,
      stripeColor2: setupColor2,
      mysticPhrase: setupPhrase,
      pattern: setupPattern
    }));

    if (isSupabaseConnected && supabase) {
      try {
        const updates = {
          stripe_color_1: setupColor1,
          stripe_color_2: setupColor2,
          mystic_phrase: setupPhrase,
          pattern: setupPattern
        };

        const { error } = await supabase.from('participants')
          .update(updates)
          .eq('id', currentUser.id);

        if (error) {
          // Si da error por la columna pattern, reintentamos sin ella
          if (error.message?.includes('pattern') || error.code === '42703') {
            const { stripe_color_1, stripe_color_2, mystic_phrase } = updates;
            await supabase.from('participants')
              .update({ stripe_color_1, stripe_color_2, mystic_phrase })
              .eq('id', currentUser.id);
          } else {
            console.error("Error al guardar setup:", error);
          }
        }
      } catch (err) {
        console.error("Error al guardar setup:", err);
      }
    }
  };

  // Probar el boludeo de forma puramente local (Previsualización)
  const handleLocalPreviewBoludeo = () => {
    if (!currentUser || !currentTenant) return;

    const randomQuote = soccerQuotes[Math.floor(Math.random() * soccerQuotes.length)];

    setActiveBoludeo({
      triggerer: `${(currentUser?.username || '').trim()} (Prueba Local)`,
      color1: setupColor1,
      color2: setupColor2,
      phrase: setupPhrase || '¡A JUGAR AL FÚTBOL!',
      message: randomQuote,
      pattern: setupPattern,
      endedAt: Date.now() + 30000
    });

    setBoludeoPopupMessage(randomQuote);
    setBoludeoPopupTriggerer(`${(currentUser?.username || '').trim()} (Prueba Local)`);
    setShowBoludeoPopup(true);
    
    // Iniciar cooldown de 30 segundos
    setBoludeoCooldown(30);
  };

  // Activar el boludeo del #1 para todos los demás
  const handleTriggerBoludeo = async () => {
    if (!currentUser || !currentTenant) return;

    // Elegir frase al azar de las 100 frases futboleras
    const randomQuote = soccerQuotes[Math.floor(Math.random() * soccerQuotes.length)];

    const newEvent = {
      tenant_id: currentTenant.id,
      triggered_by_username: currentUser.username,
      stripe_color_1: setupColor1,
      stripe_color_2: setupColor2,
      mystic_phrase: setupPhrase || '¡A JUGAR AL FÚTBOL!',
      message: randomQuote,
      pattern: setupPattern
    };

    if (isSupabaseConnected && supabase) {
      try {
        const { error } = await supabase.from('boludeo_events').insert(newEvent);
        if (error) {
          if (error.message?.includes('pattern') || error.code === '42703') {
            // Reintentar sin la columna pattern
            const { tenant_id, triggered_by_username, stripe_color_1, stripe_color_2, mystic_phrase, message } = newEvent;
            await supabase.from('boludeo_events').insert({ tenant_id, triggered_by_username, stripe_color_1, stripe_color_2, mystic_phrase, message });
          } else if (error.code === '42P01') {
            alert('⚠️ La tabla "boludeo_events" no existe en Supabase todavía.\n\nPor favor ejecuta el comando SQL en la consola de Supabase SQL Editor para crearla.');
          } else {
            alert('Error al lanzar boludeo: ' + error.message);
          }
        } else {
          // Iniciar cooldown de 30 segundos
          setBoludeoCooldown(30);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Cargar datos de Supabase
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
          // Guardar por ID si existe
          if (p.participant_id) {
            const keyId = `${p.tenant_id}_${p.participant_id}`;
            if (!formattedPreds[keyId]) formattedPreds[keyId] = {};
            formattedPreds[keyId][p.match_id] = { scoreA: p.score_a, scoreB: p.score_b };
          }
          // Guardar por username si existe
          if (p.participant_username) {
            const keyUser = `${p.tenant_id}_${(p.participant_username || '').trim()}`;
            if (!formattedPreds[keyUser]) formattedPreds[keyUser] = {};
            formattedPreds[keyUser][p.match_id] = { scoreA: p.score_a, scoreB: p.score_b };
          }
          // Fallback por si acaso
          if (!p.participant_id && !p.participant_username) {
            const keyUndef = `${p.tenant_id}_undefined`;
            if (!formattedPreds[keyUndef]) formattedPreds[keyUndef] = {};
            formattedPreds[keyUndef][p.match_id] = { scoreA: p.score_a, scoreB: p.score_b };
          }
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
        const resolvedParticipants = data || [];
        setParticipants(resolvedParticipants);

        // Mapear predicciones que estaban guardadas por username a su UUID correspondiente en el estado
        setPredictions(prev => {
          const next = { ...prev };
          resolvedParticipants.forEach(user => {
            const keyUsername = `${tenantId}_${(user.username || '').trim()}`;
            const keyId = `${tenantId}_${user.id}`;
            // Normalizar para que existan ambas claves
            if (next[keyUsername] && !next[keyId]) {
              next[keyId] = next[keyUsername];
            } else if (next[keyId] && !next[keyUsername]) {
              next[keyUsername] = next[keyId];
            }
          });
          return next;
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const loadDuelsForTenant = async (tenantId) => {
    let loadedDuels = [];
    if (isSupabaseConnected && supabase) {
      try {
        const { data, error } = await supabase
          .from('mini_duels')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });
        if (!error && data) {
          loadedDuels = data;
        } else {
          const localStr = localStorage.getItem(`local_duels_${tenantId}`);
          if (localStr) loadedDuels = JSON.parse(localStr);
        }
      } catch (err) {
        const localStr = localStorage.getItem(`local_duels_${tenantId}`);
        if (localStr) loadedDuels = JSON.parse(localStr);
      }
    } else {
      const localStr = localStorage.getItem(`local_duels_${tenantId}`);
      if (localStr) loadedDuels = JSON.parse(localStr);
    }
    setDuels(loadedDuels);
  };

  const handleLaunchDuel = async (e) => {
    e.preventDefault();
    if (!currentUser || !currentTenant || !opponentSearch) {
      alert('Por favor, selecciona un oponente válido.');
      return;
    }

    const newDuel = {
      tenant_id: currentTenant.id,
      challenger_username: currentUser.username,
      opponent_username: opponentSearch,
      challenger_move: duelMove,
      challenger_message: duelChicana,
      opponent_move: null,
      opponent_message: null,
      status: 'pending',
      winner_username: null
    };

    let savedRemote = false;
    if (isSupabaseConnected && supabase) {
      try {
        const { data, error } = await supabase
          .from('mini_duels')
          .insert(newDuel)
          .select();
        
        if (!error && data && data.length > 0) {
          savedRemote = true;
          setDuelChicana('');
          alert(`⚔️ ¡Desafío enviado con éxito a ${opponentSearch}!`);
          await loadDuelsForTenant(currentTenant.id);
        }
      } catch (err) {
        console.warn('Fallando a simulación local...', err);
      }
    }

    if (!savedRemote) {
      // Simulación inmediata local con bot si el oponente no es real, o si falta la tabla SQL
      const opponentMove = ['rock', 'paper', 'scissors'][Math.floor(Math.random() * 3)];
      
      let winner = null;
      if (duelMove === opponentMove) {
        winner = 'draw';
      } else if (
        (duelMove === 'rock' && opponentMove === 'scissors') ||
        (duelMove === 'paper' && opponentMove === 'rock') ||
        (duelMove === 'scissors' && opponentMove === 'paper')
      ) {
        winner = currentUser.username;
      } else {
        winner = opponentSearch;
      }

      let oppMsg = '';
      if (winner === 'draw') {
        oppMsg = "Empatamos de milagro... La próxima te saco a pasear.";
      } else if (winner === opponentSearch) {
        const msgs = [
          "¡Te recontra pasé el trapo! Dedicate a otra cosa.",
          "Fácil. Te gané usando la mente. Sos malísimo.",
          "Chau, patadura. Seguí participando."
        ];
        oppMsg = msgs[Math.floor(Math.random() * msgs.length)];
      } else {
        const msgs = [
          "Tuviste suerte. La próxima te corto la racha.",
          "Hiciste trampa, no me podés ganar así.",
          "Bueno, zafaste. Pero en el Prode real quedás último."
        ];
        oppMsg = msgs[Math.floor(Math.random() * msgs.length)];
      }

      const localDuel = {
        ...newDuel,
        id: 'local_' + Date.now(),
        opponent_move: opponentMove,
        opponent_message: oppMsg,
        status: 'completed',
        winner_username: winner === 'draw' ? null : winner,
        created_at: new Date().toISOString()
      };

      const currentLocal = localStorage.getItem(`local_duels_${currentTenant.id}`);
      const duelsList = currentLocal ? JSON.parse(currentLocal) : [];
      duelsList.unshift(localDuel);
      localStorage.setItem(`local_duels_${currentTenant.id}`, JSON.stringify(duelsList));

      setDuelChicana('');
      setDuels(duelsList);
      
      alert(`💡 La tabla 'mini_duels' no existe en Supabase todavía. Simulando respuesta inmediata del oponente:\n\n${opponentSearch} eligió ${opponentMove === 'rock' ? '🪨 Piedra' : opponentMove === 'paper' ? '📄 Papel' : '✂️ Tijera'}.\nResultado: ${winner === 'draw' ? 'Empate' : 'Ganador: ' + winner}\n"${oppMsg}"`);
    }
  };

  const handleReplyDuel = async (e) => {
    e.preventDefault();
    if (!selectedReplyDuel || !currentUser || !currentTenant) return;

    const challenger_move = selectedReplyDuel.challenger_move;
    const opponent_move = replyMove;
    
    let winner = null;
    if (challenger_move === opponent_move) {
      winner = 'draw';
    } else if (
      (challenger_move === 'rock' && opponent_move === 'scissors') ||
      (challenger_move === 'paper' && opponent_move === 'rock') ||
      (challenger_move === 'scissors' && opponent_move === 'paper')
    ) {
      winner = selectedReplyDuel.challenger_username;
    } else {
      winner = currentUser.username;
    }

    let updatedRemote = false;
    if (isSupabaseConnected && supabase && !selectedReplyDuel.id.toString().startsWith('local_')) {
      try {
        const { error } = await supabase
          .from('mini_duels')
          .update({
            opponent_move: replyMove,
            opponent_message: replyChicana,
            status: 'completed',
            winner_username: winner === 'draw' ? null : winner
          })
          .eq('id', selectedReplyDuel.id);
        
        if (!error) {
          updatedRemote = true;
          alert('⚔️ ¡Desafío respondido con éxito!');
          setSelectedReplyDuel(null);
          setReplyChicana('');
          await loadDuelsForTenant(currentTenant.id);
        }
      } catch (err) {
        console.warn(err);
      }
    }

    if (!updatedRemote) {
      const currentLocal = localStorage.getItem(`local_duels_${currentTenant.id}`);
      if (currentLocal) {
        const duelsList = JSON.parse(currentLocal);
        const idx = duelsList.findIndex(d => d.id === selectedReplyDuel.id);
        if (idx !== -1) {
          duelsList[idx] = {
            ...duelsList[idx],
            opponent_move: replyMove,
            opponent_message: replyChicana,
            status: 'completed',
            winner_username: winner === 'draw' ? null : winner
          };
          localStorage.setItem(`local_duels_${currentTenant.id}`, JSON.stringify(duelsList));
          setDuels(duelsList);
        }
      }
      alert('⚔️ ¡Desafío respondido con éxito (Local)!');
      setSelectedReplyDuel(null);
      setReplyChicana('');
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
    if (!currentTenant) return [];
    const list = participants;
    const ranked = list.map(user => {
      let totalPoints = 0;
      let exactScores = 0;
      let correctOutcomes = 0;

      const userPreds = predictions[`${currentTenant.id}_${user.id}`] || predictions[`${currentTenant.id}_${(user.username || '').trim()}`] || {};

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

      // Sumar +2 puntos de bonificación en la general por cada duelo ganado
      const userDuelsWon = duels.filter(d => d.winner_username === user.username && d.status === 'completed').length;
      totalPoints += (userDuelsWon * 2);

      return {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        mysticPhrase: user.mystic_phrase,
        whatsapp: user.whatsapp,
        stripeColor1: user.stripe_color_1,
        stripeColor2: user.stripe_color_2,
        pattern: user.pattern || 'diagonal',
        points: totalPoints,
        exactScores,
        correctOutcomes
      };
    });

    return ranked.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.exactScores !== a.exactScores) return b.exactScores - a.exactScores;
      return (a.username || '').localeCompare(b.username || '');
    });
  };

  const leaderboard = getLeaderboard();

  // Buscar si el usuario actual sufre el castigo (mitad inferior)
  const loggedInRankIndex = leaderboard.findIndex(p => p.id === currentUser?.id);
  const isInBottomHalf = currentUser && leaderboard.length >= 2 && loggedInRankIndex >= Math.ceil(leaderboard.length / 2);
  const leaderUser = leaderboard[0] || null;

  // Colores de castigo del Puesto #1
  const punishmentColor1 = leaderUser?.stripeColor1 || '#ff0055';
  const punishmentColor2 = leaderUser?.stripeColor2 || '#00ff87';

  // Lógica para disparar popup de chicana
  const triggerBanterPopup = (user) => {
    const board = getLeaderboard();
    const userRankIdx = board.findIndex(p => p.id === user.id);
    const leader = board[0];

    // Solo si el usuario logueado NO está en el Top 3 y hay al menos un líder
    if (userRankIdx >= 3 && leader) {
      const randomIdx = Math.floor(Math.random() * banterPhrases.length);
      const phrase = banterPhrases[randomIdx];
      setBanterMessage(`💬 Mensaje de tu líder supremo [${leader.username}]:\n\n"${phrase}"`);
      setShowBanterPopup(true);
      setTimeout(() => {
        setShowBanterPopup(false);
      }, 3000);
    }
  };

  // Crear nuevo grupo
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
      alert('Este número de Whatsapp ya está registrado en este grupo.');
      return;
    }

    const newUser = {
      tenant_id: currentTenant.id,
      username: newUserName,
      full_name: newUserFullName,
      mystic_phrase: newUserMystic,
      whatsapp: cleanWhatsapp,
      pin: cleanPin,
      is_admin: isAdminRegister,
      stripe_color_1: '#ff0055',
      stripe_color_2: '#00ff87'
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

          const loggedUser = {
            id: registeredUser.id,
            username: registeredUser.username,
            fullName: registeredUser.full_name,
            mysticPhrase: registeredUser.mystic_phrase,
            whatsapp: registeredUser.whatsapp,
            isAdmin: registeredUser.is_admin,
            stripeColor1: registeredUser.stripe_color_1,
            stripeColor2: registeredUser.stripe_color_2,
            pattern: registeredUser.pattern || 'diagonal'
          };

          setSetupColor1(registeredUser.stripe_color_1 || '#ff0055');
          setSetupColor2(registeredUser.stripe_color_2 || '#00ff87');
          setSetupPattern(registeredUser.pattern || 'diagonal');
          setSetupPhrase(registeredUser.mystic_phrase || '');

          setCurrentUser(loggedUser);
          await loadParticipantsForTenant(currentTenant.id);
          await loadDuelsForTenant(currentTenant.id);
          
          const randomIdx = Math.floor(Math.random() * welcomeBanterPhrases.length);
          setWelcomePopupMessage(welcomeBanterPhrases[randomIdx]);
          setShowWelcomePopup(true);
          
          setActiveTab('predictions');
        }
      } catch (err) {
        alert('Error en el registro: ' + err.message);
      }
    }
  };

  // Iniciar sesión (Whatsapp + PIN)
  const handleLoginUser = async (e) => {
    e.preventDefault();
    if (!loginWhatsapp.trim() || !loginPin.trim() || !currentTenant) return;

    const cleanWhatsapp = loginWhatsapp.replace(/\D/g, '').slice(-8);
    const cleanPin = loginPin.replace(/\D/g, '').slice(-4);

    const found = participants.find(p => p.whatsapp === cleanWhatsapp && p.pin === cleanPin);
    if (!found) {
      alert('Credenciales incorrectas para este grupo.');
      return;
    }

    setLoginWhatsapp('');
    setLoginPin('');
    
    const loggedUser = {
      id: found.id,
      username: found.username,
      fullName: found.full_name,
      mysticPhrase: found.mystic_phrase,
      whatsapp: found.whatsapp,
      isAdmin: found.is_admin,
      stripeColor1: found.stripe_color_1,
      stripeColor2: found.stripe_color_2,
      pattern: found.pattern || 'diagonal'
    };

    setSetupColor1(found.stripe_color_1 || '#ff0055');
    setSetupColor2(found.stripe_color_2 || '#00ff87');
    setSetupPattern(found.pattern || 'diagonal');
    setSetupPhrase(found.mystic_phrase || '');

    setCurrentUser(loggedUser);
    await loadDuelsForTenant(currentTenant.id);
    
    // Disparar popup de bienvenida ácida en Login
    const randomIdx = Math.floor(Math.random() * welcomeBanterPhrases.length);
    setWelcomePopupMessage(welcomeBanterPhrases[randomIdx]);
    setShowWelcomePopup(true);
    
    setActiveTab('predictions');
  };

  // Editar Perfil Completo (Apodo, Frase Mística y colores de castigo)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editNickInput.trim() || !currentUser || !currentTenant) return;

    const lowerNew = editNickInput.toLowerCase();
    if (participants.some(p => p.username.toLowerCase() === lowerNew && p.id !== currentUser.id)) {
      alert('Este apodo ya está en uso por otro participante.');
      return;
    }

    if (isSupabaseConnected && supabase) {
      try {
        const updates = {
          username: editNickInput,
          mystic_phrase: editMysticInput,
          stripe_color_1: editColor1Input,
          stripe_color_2: editColor2Input
        };

        const { error } = await supabase.from('participants')
          .update(updates)
          .eq('id', currentUser.id);

        if (error) throw error;

        setCurrentUser({
          ...currentUser,
          username: editNickInput,
          mysticPhrase: editMysticInput,
          stripeColor1: editColor1Input,
          stripeColor2: editColor2Input
        });
        
        setIsEditingProfile(false);
        await loadParticipantsForTenant(currentTenant.id);
        alert('Perfil actualizado con éxito.');
      } catch (err) {
        alert('Error al actualizar perfil: ' + err.message);
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
        const predictionRow = {
          tenant_id: currentTenant.id,
          match_id: matchId,
          score_a: team === 'scoreA' ? parsedVal : matchPred.scoreA,
          score_b: team === 'scoreB' ? parsedVal : matchPred.scoreB,
        };

        // Intentamos primero guardar usando participant_id
        const { error } = await supabase.from('predictions').upsert({
          ...predictionRow,
          participant_id: currentUser.id
        });

        // Si la columna participant_id no existe (código 42703), usamos participant_username
        if (error && (error.code === '42703' || error.message?.includes('participant_id'))) {
          await supabase.from('predictions').upsert({
            ...predictionRow,
            participant_username: currentUser.username
          });
        } else if (error) {
          throw error;
        }

        const keyId = `${currentTenant.id}_${currentUser.id}`;
        const keyUsername = `${currentTenant.id}_${currentUser.username}`;

        const updatedPredictions = {
          ...predictions,
          [keyId]: {
            ...predictions[keyId],
            [matchId]: updatedPred
          },
          [keyUsername]: {
            ...predictions[keyUsername],
            [matchId]: updatedPred
          }
        };
        setPredictions(updatedPredictions);
      } catch (err) {
        console.error("Error al guardar el pronóstico:", err);
      }
    }
  };

  // Sincronizar marcadores reales
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

  // Estilos inline dinámicos para el castigo de fondo en la mitad inferior o Boludeo Activo
  const hasActiveBoludeo = !!activeBoludeo;

  const getPatternStyle = (patternName, color1, color2, isBoludeo = false) => {
    // Si es boludeo activo, usamos un color mucho más intenso ('80' = 50% de opacidad)
    const opacityHex = isBoludeo ? '80' : '1A';
    const c1 = punnishmentLighter(color1) + opacityHex;
    const c2 = punnishmentLighter(color2) + opacityHex;
    const pat = patternName || 'diagonal';

    if (pat === 'horizontal') {
      return { backgroundImage: `repeating-linear-gradient(0deg, ${c1} 0px, ${c1} 20px, ${c2} 20px, ${c2} 40px)` };
    }
    if (pat === 'vertical') {
      return { backgroundImage: `repeating-linear-gradient(90deg, ${c1} 0px, ${c1} 20px, ${c2} 20px, ${c2} 40px)` };
    }
    if (pat === 'checkers') {
      return {
        backgroundImage: `linear-gradient(45deg, ${c1} 25%, transparent 25%), linear-gradient(-45deg, ${c1} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${c1} 75%), linear-gradient(-45deg, transparent 75%, ${c1} 75%)`,
        backgroundSize: '40px 40px',
        backgroundColor: (color2 && typeof color2 === 'string') ? color2 + (isBoludeo ? '4D' : '10') : '#00ff8710'
      };
    }
    // diagonal
    return { backgroundImage: `repeating-linear-gradient(45deg, ${c1} 0px, ${c1} 20px, ${c2} 20px, ${c2} 40px)` };
  };

  const punishmentStyle = hasActiveBoludeo
    ? getPatternStyle(activeBoludeo.pattern, activeBoludeo.color1, activeBoludeo.color2, true)
    : (isInBottomHalf && leaderUser)
      ? getPatternStyle(leaderUser.pattern, punishmentColor1, punishmentColor2, false)
      : {};

  function punnishmentLighter(color) {
    return (color && typeof color === 'string' && color.startsWith('#')) ? color : '#ff0055';
  }

  return (
    <div style={punishmentStyle} className={(isInBottomHalf || hasActiveBoludeo) ? "castigo-activo" : ""}>
      
      {/* CAPA: Marca de agua (deslizando por fondo en Boludeo Activo, estática en Puesto 1) */}
      {(hasActiveBoludeo || (isInBottomHalf && leaderUser)) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          overflow: 'hidden',
          opacity: hasActiveBoludeo ? 0.35 : 0.12,
          fontSize: '1.8rem',
          fontWeight: '900',
          textTransform: 'uppercase',
          color: '#ffffff',
          userSelect: 'none'
        }}>
          {hasActiveBoludeo ? (
            <>
              <style>{`
                @keyframes marquee-left-slow {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
                .boludeo-marquee {
                  display: flex;
                  width: max-content;
                  gap: 4rem;
                  animation: marquee-left-slow 20s linear infinite;
                }
                .boludeo-marquee span {
                  white-space: nowrap;
                }
                .boludeo-marquee-row {
                  overflow: hidden;
                  width: 100%;
                  display: flex;
                  align-items: center;
                  transform: rotate(-5deg);
                }
              `}</style>
              {Array.from({ length: 4 }).map((_, rowIndex) => {
                const label = `🔥 ${activeBoludeo.triggerer}: "${activeBoludeo.phrase || '¡A JUGAR AL FÚTBOL!'}" • `;
                const repeatedLabel = label.repeat(6);
                const fontSizes = ['1.6rem', '2.5rem', '1.3rem', '2.0rem'];
                const durations = ['28s', '20s', '36s', '24s'];
                return (
                  <div key={rowIndex} className="boludeo-marquee-row" style={{ fontSize: fontSizes[rowIndex] }}>
                    <div className="boludeo-marquee" style={{ 
                      animationDirection: rowIndex % 2 === 0 ? 'normal' : 'reverse',
                      animationDuration: durations[rowIndex]
                    }}>
                      <span>{repeatedLabel}</span>
                      <span>{repeatedLabel}</span>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '3rem',
              padding: '2rem',
              width: '100%',
              height: '100%'
            }}>
              {Array.from({ length: 40 }).map((_, i) => {
                const label = `👑 ${leaderUser.username}: "${leaderUser.mysticPhrase || 'SOY EL MEJOR'}"`;
                return (
                  <span key={i} style={{ transform: 'rotate(-15deg)', whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL WELCOME POPUP (Mensaje ácido de bienvenida al registrarse) */}
      {showWelcomePopup && (
        <div className="onboarding-wrapper" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.92)', zIndex: 2005, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="glass-card onboarding-card text-center" style={{ borderLeft: '4px solid #00ff87', animation: 'float 0.5s ease-out', maxWidth: '480px', width: '90%', padding: '2rem' }}>
            <span style={{ fontSize: '3.5rem' }}>🤡</span>
            <h2 style={{ marginTop: '1rem', color: '#00ff87', fontSize: '1.75rem' }}>¡BIENVENIDO, PATADURA!</h2>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
              Te registraste en: {currentTenant?.name}
            </h4>
            <p style={{ color: 'white', margin: '1.5rem 0', fontSize: '1.25rem', lineHeight: '1.6', fontWeight: 600, fontStyle: 'italic' }}>
              "{welcomePopupMessage}"
            </p>
            <button 
              className="btn-primary" 
              onClick={() => setShowWelcomePopup(false)}
              style={{ 
                marginTop: '1.5rem', 
                width: 'auto', 
                padding: '0.75rem 3rem', 
                fontSize: '1rem',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #00ff87, #60efff)',
                border: 'none',
                color: '#000',
                cursor: 'pointer'
              }}
            >
              Cerrar y Tragar Veneno 🧪
            </button>
          </div>
        </div>
      )}

      {/* MODAL BANTER POPUP (Chicana de 3 segundos) */}
      {showBanterPopup && (
        <div className="onboarding-wrapper" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="glass-card onboarding-card text-center" style={{ borderLeft: '4px solid #ffb703', animation: 'float 0.5s ease-out' }}>
            <span style={{ fontSize: '3.5rem' }}>😜</span>
            <h2 style={{ marginTop: '1rem', color: '#ffb703' }}>¡ATENCIÓN PERDEDOR!</h2>
            <p style={{ color: 'white', margin: '1.5rem 0', fontSize: '1.15rem', lineHeight: '1.6', fontWeight: 600, whiteSpace: 'pre-wrap' }}>
              {banterMessage}
            </p>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Este mensaje se cerrará solo en segundos...</div>
          </div>
        </div>
      )}      {/* MODAL BOLUDEO POPUP (Chicana de botón Test Boludeo) */}
      {showBoludeoPopup && (
        <div className="onboarding-wrapper" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="glass-card onboarding-card text-center" style={{ borderLeft: '4px solid #ff4d4d', animation: 'float 0.5s ease-out', maxWidth: '450px', width: '90%' }}>
            <span style={{ fontSize: '3.5rem' }}>🔥</span>
            <h2 style={{ marginTop: '1rem', color: '#ff4d4d' }}>🚨 ¡TE ESTÁN BOLUDEANDO! 🚨</h2>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', marginTop: '0.5rem' }}>
              De: {boludeoPopupTriggerer}
            </h4>
            <p style={{ color: 'white', margin: '1.5rem 0', fontSize: '1.35rem', lineHeight: '1.6', fontWeight: 700, whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
              "{boludeoPopupMessage}"
            </p>
            <button 
              className="btn-primary" 
              onClick={() => setShowBoludeoPopup(false)}
              style={{ 
                marginTop: '1.5rem', 
                width: 'auto', 
                padding: '0.75rem 2.5rem', 
                fontSize: '1rem',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #ff4d4d, #f1a80a)'
              }}
            >
              Entendido 😔
            </button>
          </div>
        </div>
      )}

      {/* Cabecera */}
      <header className="app-header" style={{ position: 'relative', zIndex: 10 }}>
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
                <>
                  <span className="user-badge" style={{ cursor: 'pointer' }} onClick={() => {
                    setEditNickInput(currentUser.username);
                    setEditMysticInput(currentUser.mysticPhrase || '');
                    setEditColor1Input(currentUser.stripeColor1 || '#ff0055');
                    setEditColor2Input(currentUser.stripeColor2 || '#00ff87');
                    setIsEditingProfile(true);
                  }}>
                    👑 <strong>{currentUser.username}</strong>
                  </span>

                </>
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

      {/* MODAL: Modificar Perfil / Setup */}
      {isEditingProfile && (
        <div className="onboarding-wrapper" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1001 }}>
          <div className="glass-card onboarding-card">
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1.25rem', color: 'var(--accent-color)' }}>⚙️ Editar mi Perfil</h3>
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label>Apodo / Nickname</label>
                <input
                  type="text"
                  className="form-control"
                  value={editNickInput}
                  onChange={(e) => setEditNickInput(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Frase Mística</label>
                <input
                  type="text"
                  className="form-control"
                  value={editMysticInput}
                  onChange={(e) => setEditMysticInput(e.target.value)}
                  placeholder="¡Escribe tu lema!"
                />
              </div>

              {/* Mostrar editor de colores de castigo si está en el TOP 3 */}
              {leaderboard.findIndex(p => p.id === currentUser?.id) < 3 && (
                <div style={{ background: 'rgba(255, 215, 0, 0.05)', border: '1px solid var(--primary-gold)', padding: '1rem', borderRadius: '8px', marginTop: '1rem', marginBottom: '1rem' }}>
                  <h4 style={{ color: 'var(--primary-gold)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>👑 ¡PODER SUPREMO DEL CAMPEÓN!</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Como Campeón (Puesto #1), tienes el poder de castigar a los "Losers" (mitad inferior de la tabla) eligiendo a tu criterio los 2 colores a rayas que verán de fondo. Además, tu Frase Mística se estampará como marca de agua en todos sus dispositivos.
                  </p>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Color 1</label>
                      <input
                        type="color"
                        style={{ height: '40px', width: '100%', cursor: 'pointer', padding: 0 }}
                        value={editColor1Input}
                        onChange={(e) => setEditColor1Input(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Color 2</label>
                      <input
                        type="color"
                        style={{ height: '40px', width: '100%', cursor: 'pointer', padding: 0 }}
                        value={editColor2Input}
                        onChange={(e) => setEditColor2Input(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn-primary">Guardar</button>
                <button type="button" className="btn-secondary" onClick={() => setIsEditingProfile(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="container" style={{ position: 'relative', zIndex: 5 }}>
        
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

                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', width: '100%' }}>
                      {currentMatch.status === 'played' ? (
                        (() => {
                          const pts = calculatePoints(predictions[`${currentTenant.id}_${currentUser.id}`]?.[currentMatch.id], currentMatch);
                          let badgeBg = 'rgba(255, 77, 77, 0.15)';
                          let badgeColor = '#ff4d4d';
                          let comment = '';
                          
                          if (pts === 0) {
                            badgeBg = 'rgba(255, 77, 77, 0.2)';
                            badgeColor = '#ff4d4d';
                            const phrases = [
                              "¡Horrible! No le pegaste ni al arco iris 🪵",
                              "¡Un espanto! Dedicate a otra cosa... 🩴",
                              "¿Pusiste el resultado con los ojos cerrados? 🙈",
                              "¡Cero absoluto! Tus amigos se te están cagando de risa 🤡",
                              "Ni queriendo le errás tan feo 📉"
                            ];
                            comment = phrases[currentMatch.id % phrases.length];
                          } else if (pts >= 1 && pts <= 4) {
                            badgeBg = 'rgba(241, 168, 10, 0.2)';
                            badgeColor = '#f1a80a';
                            const phrases = [
                              "Zafaste raspando. Suma algo al menos... 🐢",
                              "Casi casi... Estuvo cerca pero te faltó fútbol ⚽",
                              "Algo es algo, peor es nada 🤷",
                              "¡Buen intento! Seguí participando 📈",
                              "Un puntito inteligente para la tabla 🧠"
                            ];
                            comment = phrases[currentMatch.id % phrases.length];
                          } else {
                            badgeBg = 'rgba(0, 255, 135, 0.2)';
                            badgeColor = '#00ff87';
                            const phrases = [
                              "¡Qué bestia! ¡Sos el mismísimo DT del prode! 🧙‍♂️",
                              "¡Puntaje perfecto! ¡La tenés toda clara! 🚀",
                              "¡Descomunal! Viajás en primera clase al mundial ✈️",
                              "¡Sos Gardel! Metiste magia pura ✨",
                              "¡Increíble! Este pronóstico fue cine 🎬"
                            ];
                            comment = phrases[currentMatch.id % phrases.length];
                          }

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ textAlign: 'left' }}>
                                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Resultado Oficial</span>
                                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginTop: '0.2rem' }}>
                                    {currentMatch.actualScoreA} - {currentMatch.actualScoreB}
                                  </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tu Puntuación</span>
                                  <div style={{ 
                                    background: badgeBg, 
                                    color: badgeColor, 
                                    padding: '0.4rem 1rem', 
                                    borderRadius: '8px', 
                                    fontSize: '1.25rem', 
                                    fontWeight: 'bold',
                                    marginTop: '0.2rem',
                                    border: `1px solid ${badgeColor}44`,
                                    display: 'inline-block'
                                  }}>
                                    +{pts} {pts === 1 ? 'punto' : 'puntos'}
                                  </div>
                                </div>
                              </div>
                              <div style={{ 
                                background: 'rgba(255,255,255,0.03)', 
                                padding: '0.75rem 1rem', 
                                borderRadius: '8px', 
                                borderLeft: `4px solid ${badgeColor}`,
                                fontStyle: 'italic',
                                fontSize: '0.95rem',
                                color: '#fff',
                                marginTop: '0.5rem',
                                textAlign: 'left'
                              }}>
                                {comment}
                              </div>
                            </div>
                          );
                        })()
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
                
                {/* Cartel de Advertencia de Poderes */}
                <div style={{ background: 'rgba(255, 77, 77, 0.05)', border: '1px solid rgba(255, 77, 77, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  📢 <strong>Regla del Campeón</strong>: El líder absoluto (Puesto #1) tiene el poder de castigar visualmente a los "Losers" (mitad inferior de la tabla) personalizando sus colores de fondo a rayas continuas y estampando su Frase Mística de forma permanente en sus pantallas. ¡Haz clic en tu apodo arriba para personalizar!
                </div>
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
                      {leaderboard.map((row, idx) => (
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

                {/* Sección de Desglose de Puntos por Partido Jugado */}
                {(() => {
                  const playedMatches = matches.filter(m => m.status === 'played');
                  if (playedMatches.length === 0) {
                    return (
                      <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-color)', marginBottom: '0.75rem' }}>📊 Puntos Obtenidos por Partido</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          Los desgloses de predicciones y puntos por partido aparecerán aquí tan pronto como comiencen a jugarse los partidos reales del mundial.
                        </p>
                      </div>
                    );
                  }

                  const activeMatchId = selectedDetailedMatchId || playedMatches[0]?.id || '';
                  const selectedMatch = playedMatches.find(m => m.id === parseInt(activeMatchId)) || playedMatches[0] || null;

                  if (!selectedMatch) return null;

                  const breakdownRows = participants.map(user => {
                    const userPreds = predictions[`${currentTenant.id}_${user.id}`] || predictions[`${currentTenant.id}_${(user.username || '').trim()}`] || {};
                    const pred = userPreds[selectedMatch.id] || null;
                    const pts = calculatePoints(pred, selectedMatch);
                    return {
                      id: user.id,
                      username: user.username,
                      fullName: user.full_name,
                      pred,
                      points: pts
                    };
                  }).sort((a, b) => {
                    if (b.points !== a.points) return b.points - a.points;
                    return (a.username || '').localeCompare(b.username || '');
                  });

                  return (
                    <div style={{ marginTop: '2.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
                      <h3 style={{ fontSize: '1.2rem', color: 'var(--accent-color)', marginBottom: '1rem' }}>📊 Puntos Obtenidos por Partido</h3>
                      
                      <div className="form-group" style={{ maxWidth: '320px', marginBottom: '1.5rem' }}>
                        <label style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Seleccionar Partido Jugado</label>
                        <select 
                          className="form-control"
                          value={selectedMatch.id}
                          onChange={(e) => setSelectedDetailedMatchId(e.target.value)}
                          style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#fff', height: '38px' }}
                        >
                          {playedMatches.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.group} • {m.teamA} vs {m.teamB}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Tarjeta de Marcador Oficial */}
                      <div className="glass-card text-center animate-fade-in" style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--glass-border)', marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{selectedMatch.group} • Marcador Oficial</div>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
                          <span style={{ fontSize: '1.1rem' }}>{selectedMatch.flagA} <strong>{selectedMatch.teamA}</strong></span>
                          <span style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--accent-color)', padding: '0 0.5rem', background: 'rgba(0, 255, 135, 0.05)', borderRadius: '6px' }}>
                            {selectedMatch.actualScoreA} - {selectedMatch.actualScoreB}
                          </span>
                          <span style={{ fontSize: '1.1rem' }}><strong>{selectedMatch.teamB}</strong> {selectedMatch.flagB}</span>
                        </div>
                      </div>

                      {/* Tabla Desglose */}
                      <div style={{ overflowX: 'auto' }}>
                        <table className="leaderboard-table" style={{ fontSize: '0.9rem' }}>
                          <thead>
                            <tr>
                              <th>Pos</th>
                              <th>Participante</th>
                              <th style={{ textAlign: 'center' }}>Predicción</th>
                              <th style={{ textAlign: 'right' }}>Puntos Sumados</th>
                            </tr>
                          </thead>
                          <tbody>
                            {breakdownRows.map((row, idx) => {
                              const isCurrentUser = row.id === currentUser?.id;
                              const pts = row.points;
                              
                              const badgeStyle = pts === 7 
                                ? { background: 'rgba(0, 255, 135, 0.15)', color: 'var(--accent-color)', border: '1px solid var(--accent-color)' }
                                : pts >= 3
                                  ? { background: 'rgba(96, 239, 255, 0.15)', color: '#60efff', border: '1px solid #60efff' }
                                  : { background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.05)' };

                              return (
                                <tr key={row.id} className="leaderboard-row" style={{ background: isCurrentUser ? 'rgba(0, 255, 135, 0.04)' : 'transparent' }}>
                                  <td className="rank-cell" style={{ fontWeight: isCurrentUser ? 'bold' : 'normal' }}>{idx + 1}º</td>
                                  <td>
                                    <span style={{ fontWeight: isCurrentUser ? 'bold' : 'normal', color: isCurrentUser ? 'var(--accent-color)' : 'white' }}>
                                      {row.username} {isCurrentUser && ' (Tú)'}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                    {row.pred ? (
                                      <span style={{ color: '#fff' }}>{row.pred.scoreA} - {row.pred.scoreB}</span>
                                    ) : (
                                      <span style={{ color: 'var(--text-secondary)', fontWeight: 'normal', fontSize: '0.8rem' }}>Sin cargar</span>
                                    )}
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    <span className="points-pill" style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', ...badgeStyle }}>
                                      +{pts} pts
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
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
                        const friend = participants.find(p => p.id === selectedFriendId);
                        const friendKeyId = `${currentTenant.id}_${selectedFriendId}`;
                        const friendKeyUsername = friend ? `${currentTenant.id}_${(friend.username || '').trim()}` : '';
                        const pred = predictions[friendKeyId]?.[m.id] || predictions[friendKeyUsername]?.[m.id];
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
                    const compUser = participants.find(p => p.id === comparisonUserId);
                    const compKeyId = `${currentTenant.id}_${comparisonUserId}`;
                    const compKeyUsername = compUser ? `${currentTenant.id}_${(compUser.username || '').trim()}` : '';
                    const pred = comparisonUserId ? (predictions[compKeyId]?.[match.id] || predictions[compKeyUsername]?.[match.id]) : null;
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

            {/* PESTAÑA: Desafíos Pre-Mundial (Piedra, Papel o Tijera) */}
            {activeTab === 'duels' && (
              <div className="glass-card">
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ⚔️ Arena de Duelos Pre-Mundial
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  ¿Aburrido esperando el mundial? Desafía a tus amigos a <strong>Piedra, Papel o Tijera</strong>. 
                  ¡Cada duelo ganado suma <strong>+2 puntos</strong> en la Tabla General de posiciones!
                </p>

                {/* Sección Desafíos Pendientes por responder */}
                {(() => {
                  const pendingToMe = duels.filter(d => d.opponent_username === currentUser.username && d.status === 'pending');
                  if (pendingToMe.length === 0) return null;
                  return (
                    <div className="glass-card mb-4 animate-fade-in" style={{ borderLeft: '4px solid #ff4d4d', background: 'rgba(255, 77, 77, 0.03)' }}>
                      <h4 style={{ color: '#ff4d4d', marginBottom: '0.75rem', fontWeight: 'bold' }}>
                        🚨 Tienes {pendingToMe.length} {pendingToMe.length === 1 ? 'Desafío Pendiente' : 'Desafíos Pendientes'}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {pendingToMe.map(d => (
                          <div key={d.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <span><strong>{d.challenger_username}</strong> te desafió a un duelo.</span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(d.created_at || Date.now()).toLocaleDateString()}</span>
                            </div>
                            {d.challenger_message && (
                              <p style={{ fontStyle: 'italic', color: '#ffb703', margin: '0.5rem 0', fontSize: '0.9rem' }}>
                                "{d.challenger_message}"
                              </p>
                            )}

                            {selectedReplyDuel?.id === d.id ? (
                              <form onSubmit={handleReplyDuel} style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '8px' }}>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>ELIGE TU MOVIMIENTO:</label>
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                  <button type="button" className={`btn-secondary ${replyMove === 'rock' ? 'active' : ''}`} onClick={() => setReplyMove('rock')} style={{ flex: 1, padding: '0.75rem', borderColor: replyMove === 'rock' ? '#00ff87' : 'var(--glass-border)' }}>
                                    🪨 Piedra
                                  </button>
                                  <button type="button" className={`btn-secondary ${replyMove === 'paper' ? 'active' : ''}`} onClick={() => setReplyMove('paper')} style={{ flex: 1, padding: '0.75rem', borderColor: replyMove === 'paper' ? '#00ff87' : 'var(--glass-border)' }}>
                                    📄 Papel
                                  </button>
                                  <button type="button" className={`btn-secondary ${replyMove === 'scissors' ? 'active' : ''}`} onClick={() => setReplyMove('scissors')} style={{ flex: 1, padding: '0.75rem', borderColor: replyMove === 'scissors' ? '#00ff87' : 'var(--glass-border)' }}>
                                    ✂️ Tijera
                                  </button>
                                </div>
                                <div className="form-group">
                                  <label>CONTRACANASTA / MENSAJE ÁCIDO:</label>
                                  <input type="text" className="form-control" placeholder="Ej. ¡Sos malísimo! Tomá pa que guardes..." value={replyChicana} onChange={(e) => setReplyChicana(e.target.value)} />
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  <button type="submit" className="btn-primary" style={{ width: 'auto', background: 'linear-gradient(135deg, #ff4d4d, #f1a80a)' }}>
                                    ⚔️ ¡JUGAR!
                                  </button>
                                  <button type="button" className="btn-secondary" onClick={() => setSelectedReplyDuel(null)} style={{ width: 'auto' }}>
                                    Cancelar
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <button className="btn-primary" onClick={() => { setSelectedReplyDuel(d); setReplyMove('rock'); }} style={{ width: 'auto', marginTop: '0.5rem', padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                                ⚔️ Responder Desafío
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                  {/* Formulario para Crear Duelo */}
                  <div className="glass-card" style={{ flex: '1 1 320px', background: 'rgba(255,255,255,0.01)' }}>
                    <h3 style={{ fontSize: '1.15rem', color: '#ffb703', marginBottom: '1.25rem', fontWeight: 'bold' }}>
                      ⚔️ Lanzar Nuevo Desafío
                    </h3>
                    <form onSubmit={handleLaunchDuel}>
                      <div className="form-group">
                        <label>Tipo de Desafío</label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                          <button type="button" className={`btn-secondary ${!isRandomOpponent ? 'active' : ''}`} onClick={() => { setIsRandomOpponent(false); setOpponentSearch(''); }} style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', borderColor: !isRandomOpponent ? '#ffb703' : 'var(--glass-border)' }}>
                            🎯 Dirigido
                          </button>
                          <button type="button" className={`btn-secondary ${isRandomOpponent ? 'active' : ''}`} onClick={() => { setIsRandomOpponent(true); setOpponentSearch('Al Azar 🎲'); }} style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', borderColor: isRandomOpponent ? '#ffb703' : 'var(--glass-border)' }}>
                            🎲 Al Azar
                          </button>
                        </div>
                      </div>

                      {!isRandomOpponent && (
                        <div className="form-group">
                          <label>Elegir Oponente</label>
                          <select 
                            className="form-control"
                            value={opponentSearch} 
                            onChange={(e) => setOpponentSearch(e.target.value)}
                            required
                          >
                            <option value="">-- Selecciona un oponente --</option>
                            {participants.filter(p => p.username !== currentUser.username).map(p => (
                              <option key={p.id} value={p.username}>{p.username} ({p.full_name || p.username})</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {isRandomOpponent && (
                        <div className="form-group">
                          <label>Oponente Seleccionado</label>
                          <input type="text" className="form-control" value="Oponente sorpresa al azar 🎲" readOnly style={{ background: 'rgba(0,0,0,0.3)', color: '#ffb703', fontWeight: 'bold' }} />
                        </div>
                      )}

                      <div className="form-group">
                        <label>Tu Movimiento</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button type="button" className={`btn-secondary ${duelMove === 'rock' ? 'active' : ''}`} onClick={() => setDuelMove('rock')} style={{ flex: 1, padding: '0.75rem', borderColor: duelMove === 'rock' ? '#ffb703' : 'var(--glass-border)' }}>
                            🪨 Piedra
                          </button>
                          <button type="button" className={`btn-secondary ${duelMove === 'paper' ? 'active' : ''}`} onClick={() => setDuelMove('paper')} style={{ flex: 1, padding: '0.75rem', borderColor: duelMove === 'paper' ? '#ffb703' : 'var(--glass-border)' }}>
                            📄 Papel
                          </button>
                          <button type="button" className={`btn-secondary ${duelMove === 'scissors' ? 'active' : ''}`} onClick={() => setDuelMove('scissors')} style={{ flex: 1, padding: '0.75rem', borderColor: duelMove === 'scissors' ? '#ffb703' : 'var(--glass-border)' }}>
                            ✂️ Tijera
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Mensaje de Chicana (Generado por Sistema)</span>
                          <button type="button" onClick={refreshSystemDuelPhrase} style={{ background: 'none', border: 'none', color: '#60efff', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}>
                            🔄 Cambiar
                          </button>
                        </label>
                        <div style={{ 
                          background: 'rgba(0,0,0,0.4)', 
                          padding: '0.75rem 1rem', 
                          borderRadius: '8px', 
                          border: '1px solid var(--glass-border)',
                          fontSize: '0.9rem',
                          fontStyle: 'italic',
                          color: '#ffb703'
                        }}>
                          "{systemDuelPhrase || 'Pensando una chicana...'}"
                        </div>
                      </div>

                      <button type="submit" className="btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, #ffb703, #ff4d4d)', fontWeight: 'bold' }}>
                        ⚔️ ENVIAR DUELO
                      </button>
                    </form>
                  </div>

                  {/* Historial de Duelos del Grupo */}
                  <div className="glass-card" style={{ flex: '1 1 380px', maxHeight: '450px', overflowY: 'auto' }}>
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--accent-color)', marginBottom: '1rem', fontWeight: 'bold' }}>
                      📋 Historial de Duelos
                    </h3>
                    {duels.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Aún no se han jugado duelos en este grupo.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {duels.map(d => {
                          const isCompleted = d.status === 'completed';
                          const isDraw = isCompleted && !d.winner_username;
                          const isIWinner = isCompleted && d.winner_username === currentUser.username;
                          const isILoser = isCompleted && d.winner_username && d.winner_username !== currentUser.username && (d.challenger_username === currentUser.username || d.opponent_username === currentUser.username);
                          
                          let badgeBg = 'rgba(255,255,255,0.05)';
                          let badgeText = 'Pendiente';
                          let badgeColor = 'var(--text-secondary)';

                          if (isCompleted) {
                            if (isDraw) {
                              badgeBg = 'rgba(255, 183, 3, 0.1)';
                              badgeText = 'Empate';
                              badgeColor = '#ffb703';
                            } else {
                              badgeBg = isIWinner ? 'rgba(0, 255, 135, 0.1)' : 'rgba(255, 77, 77, 0.1)';
                              badgeText = isIWinner ? 'Ganaste 🎉' : `Ganó ${d.winner_username}`;
                              badgeColor = isIWinner ? '#00ff87' : '#ff4d4d';
                            }
                          }

                          return (
                            <div key={d.id} style={{ 
                              background: 'rgba(0,0,0,0.2)', 
                              padding: '0.85rem', 
                              borderRadius: '8px',
                              border: isIWinner ? '1px solid rgba(0, 255, 135, 0.2)' : isILoser ? '1px solid rgba(255, 77, 77, 0.2)' : '1px solid rgba(255,255,255,0.03)' 
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                                  ⚔️ {d.challenger_username} vs {d.opponent_username}
                                </span>
                                <span style={{ 
                                  fontSize: '0.75rem', 
                                  background: badgeBg, 
                                  color: badgeColor, 
                                  padding: '0.2rem 0.5rem', 
                                  borderRadius: '4px',
                                  fontWeight: 'bold'
                                }}>
                                  {badgeText}
                                </span>
                              </div>

                              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <div>
                                  💬 {d.challenger_username}: "{d.challenger_message || '...'}" 
                                  {isCompleted && ` (${d.challenger_move === 'rock' ? '🪨' : d.challenger_move === 'paper' ? '📄' : '✂️'})`}
                                </div>
                                {isCompleted && (
                                  <div>
                                    💬 {d.opponent_username}: "{d.opponent_message || '...'}" 
                                    {` (${d.opponent_move === 'rock' ? '🪨' : d.opponent_move === 'paper' ? '📄' : '✂️'})`}
                                  </div>
                                )}
                                
                                {isCompleted && d.loser_response && (
                                  <div style={{ 
                                    background: 'rgba(255,255,255,0.03)', 
                                    padding: '0.4rem 0.6rem', 
                                    borderRadius: '4px', 
                                    marginTop: '0.4rem',
                                    borderLeft: '3px solid #ff4d4d',
                                    color: '#fff',
                                    fontSize: '0.82rem'
                                  }}>
                                    <strong>Descargo del Perdedor:</strong> "{d.loser_response}"
                                  </div>
                                )}

                                {isILoser && !d.loser_response && (
                                  <form onSubmit={(e) => {
                                    const inputVal = e.target.elements.respText.value;
                                    handleSendLoserResponse(e, d.id, inputVal);
                                    e.target.elements.respText.value = '';
                                  }} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    <input 
                                      type="text" 
                                      name="respText"
                                      maxLength={200}
                                      className="form-control"
                                      placeholder="Mete excusa de perdedor (máx 200 car.)..." 
                                      required 
                                      style={{ height: '30px', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                                    />
                                    <button className="btn-primary" style={{ width: 'auto', height: '30px', padding: '0 0.75rem', fontSize: '0.75rem', background: 'linear-gradient(135deg, #ff4d4d, #f1a80a)' }}>
                                      Enviar
                                    </button>
                                  </form>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* HISTÓRICO DE MENSAJES (Muro de Descargos de Perdedores) */}
                <div className="glass-card mb-4" style={{ marginTop: '2rem', background: 'rgba(255, 255, 255, 0.01)' }}>
                  <h3 style={{ fontSize: '1.25rem', color: '#ffb703', marginBottom: '1rem', fontWeight: 'bold' }}>
                    💬 Histórico de Mensajes y Descargos
                  </h3>
                  {(() => {
                    const myMessages = duels.filter(d => 
                      d.status === 'completed' && 
                      d.loser_response && 
                      (d.challenger_username === currentUser.username || d.opponent_username === currentUser.username)
                    );
                    if (myMessages.length === 0) {
                      return <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No tienes descargos enviados ni recibidos todavía.</p>;
                    }
                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {myMessages.map(d => {
                          const isSentByMe = (d.winner_username !== currentUser.username);
                          const recipient = isSentByMe ? d.winner_username : (d.challenger_username === currentUser.username ? d.opponent_username : d.challenger_username);
                          return (
                            <div key={d.id} style={{ 
                              background: 'rgba(0,0,0,0.3)', 
                              padding: '1rem', 
                              borderRadius: '8px', 
                              borderLeft: isSentByMe ? '4px solid #ff4d4d' : '4px solid #00ff87',
                              border: '1px solid rgba(255,255,255,0.04)'
                            }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{isSentByMe ? '⬆️ Enviado a: ' + recipient : '⬇️ Recibido de: ' + recipient}</span>
                                <span>{new Date(d.created_at || Date.now()).toLocaleDateString()}</span>
                              </div>
                              <p style={{ margin: 0, fontSize: '0.9rem', color: 'white', fontStyle: 'italic', fontWeight: 500 }}>
                                "{d.loser_response}"
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* MODAL LOSER RESPONSE POPUP (Modal inmediato cuando perdés localmente) */}
            {showLoserResponseModal && (
              <div className="onboarding-wrapper" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.92)', zIndex: 2005, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className="glass-card onboarding-card text-center" style={{ borderLeft: '4px solid #ff4d4d', animation: 'float 0.5s ease-out', maxWidth: '460px', width: '90%', padding: '2rem' }}>
                  <span style={{ fontSize: '3.5rem' }}>😭</span>
                  <h2 style={{ marginTop: '1rem', color: '#ff4d4d', fontSize: '1.6rem' }}>¡PERDISTE EL DUELO!</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.5rem 0' }}>
                    Como perdedor, tienes derecho a mandar tu descargo (máx 200 caracteres):
                  </p>
                  
                  <form onSubmit={(e) => handleSendLoserResponse(e, activeLosingDuelId, loserResponseText)} style={{ marginTop: '1rem' }}>
                    <div className="form-group">
                      <textarea 
                        className="form-control" 
                        maxLength={200}
                        rows={3}
                        required
                        placeholder="Ej. Tuviste suerte, patadura. La pelota no dobla..."
                        value={loserResponseText}
                        onChange={(e) => setLoserResponseText(e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid var(--glass-border)', padding: '0.75rem', width: '100%', resize: 'none' }}
                      />
                      <small style={{ color: 'var(--text-secondary)', display: 'block', textAlign: 'right', marginTop: '0.25rem' }}>
                        {loserResponseText.length}/200 caracteres
                      </small>
                    </div>
                    
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      style={{ 
                        marginTop: '1rem', 
                        width: '100%', 
                        padding: '0.75rem', 
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, #ff4d4d, #f1a80a)'
                      }}
                    >
                      Enviar Descargo Humillante 🚀
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Banner de Test Boludeo */}
            <div className="glass-card mb-4" style={{ 
              display: 'flex', 
              flexDirection: 'column',
              background: 'linear-gradient(135deg, rgba(255, 77, 77, 0.08), rgba(241, 168, 10, 0.08))', 
              border: '1px solid rgba(255, 77, 77, 0.3)',
              padding: '1.25rem',
              borderRadius: '12px',
              gap: '1rem',
              marginTop: '2rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: '1 1 250px' }}>
                  <h4 style={{ color: '#ffb703', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    🔥 Test Boludeo del #1
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Personaliza tu joda presionando "⚙️ SETUP BOLUDEO" o castiga a todos tus amigos con "💥 ¡BOLUDEAR!".
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
                  <button 
                    className="btn-secondary" 
                    onClick={() => setShowSetupBoludeo(!showSetupBoludeo)} 
                    style={{ 
                      width: 'auto',
                      minWidth: '120px',
                      borderColor: '#ffb703',
                      color: '#ffb703',
                      fontWeight: 'bold',
                      fontSize: '0.95rem',
                      padding: '0.6rem 1.2rem',
                      borderRadius: '8px'
                    }}
                  >
                    ⚙️ SETUP BOLUDEO
                  </button>
                  <button 
                    className="btn-primary" 
                    onClick={async () => {
                      await handleSaveSetup();
                      await handleTriggerBoludeo();
                    }} 
                    disabled={boludeoCooldown > 0}
                    style={{ 
                      width: 'auto', 
                      minWidth: '130px',
                      background: boludeoCooldown > 0 ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #ff4d4d, #f1a80a)', 
                      border: 'none',
                      boxShadow: boludeoCooldown > 0 ? 'none' : '0 4px 12px rgba(255, 77, 77, 0.4)',
                      fontWeight: 'bold',
                      fontSize: '0.95rem',
                      padding: '0.6rem 1.2rem',
                      borderRadius: '8px',
                      color: boludeoCooldown > 0 ? '#666' : '#fff',
                      cursor: boludeoCooldown > 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {boludeoCooldown > 0 ? `⏳ (${boludeoCooldown}s)` : '💥 ¡BOLUDEAR!'}
                  </button>
                </div>
              </div>

              {/* Panel de Configuración Expandible */}
              {showSetupBoludeo && (
                <div className="glass-card animate-fade-in" style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', marginTop: '0.5rem' }}>
                  <h5 style={{ color: '#ffb703', fontSize: '0.95rem', marginBottom: '1rem', fontWeight: 'bold' }}>⚙️ Personalizar mi Boludeo</h5>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Frase Mística de la Joda</label>
                      <input 
                        type="text" 
                        className="form-control"
                        placeholder="Ej. ¡Llora la esférica!"
                        value={setupPhrase}
                        onChange={(e) => setSetupPhrase(e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#fff' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <div className="form-group" style={{ flex: '1 1 100px', margin: 0 }}>
                        <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Color Raya 1</label>
                        <input 
                          type="color" 
                          style={{ height: '38px', width: '100%', cursor: 'pointer', padding: 0, background: 'none', border: 'none' }}
                          value={setupColor1}
                          onChange={(e) => setSetupColor1(e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ flex: '1 1 100px', margin: 0 }}>
                        <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Color Raya 2</label>
                        <input 
                          type="color" 
                          style={{ height: '38px', width: '100%', cursor: 'pointer', padding: 0, background: 'none', border: 'none' }}
                          value={setupColor2}
                          onChange={(e) => setSetupColor2(e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ flex: '1 1 140px', margin: 0 }}>
                        <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Patrón de Fondo</label>
                        <select 
                          className="form-control"
                          value={setupPattern}
                          onChange={(e) => setSetupPattern(e.target.value)}
                          style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#fff', height: '38px' }}
                        >
                          <option value="diagonal">Líneas Diagonales</option>
                          <option value="horizontal">Líneas Horizontales</option>
                          <option value="vertical">Líneas Verticales</option>
                          <option value="checkers">Tablero de Ajedrez</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button 
                        type="button"
                        className="btn-secondary"
                        onClick={async () => {
                          await handleSaveSetup();
                          handleLocalPreviewBoludeo();
                        }}
                        disabled={boludeoCooldown > 0}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderColor: '#ffb703', color: '#ffb703', cursor: boludeoCooldown > 0 ? 'not-allowed' : 'pointer' }}
                      >
                        🔍 PROBAR SETUP
                      </button>
                      <button 
                        type="button"
                        className="btn-primary"
                        onClick={async () => {
                          await handleSaveSetup();
                          setShowSetupBoludeo(false);
                          alert('¡Configuración guardada! Listo para usar.');
                        }}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', width: 'auto', background: 'linear-gradient(135deg, #00ff87, #60efff)' }}
                      >
                        💾 GUARDAR SETUP
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {boludeoCooldown > 0 && (
                <div style={{ width: '100%', background: 'rgba(255, 255, 255, 0.08)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${(boludeoCooldown / 30) * 100}%`,
                    background: 'linear-gradient(90deg, #ff4d4d, #f1a80a)',
                    height: '100%',
                    transition: 'width 1s linear',
                    borderRadius: '3px'
                  }} />
                </div>
              )}
            </div>

            {/* Menu Tabs */}
            <nav className="tabs-navigation" style={{ marginTop: '1rem' }}>
              <button className={`tab-btn ${activeTab === 'predictions' ? 'active' : ''}`} onClick={() => setActiveTab('predictions')}>
                📝 Mis Predicciones
              </button>
              <button className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
                📊 Tabla General
              </button>
              <button className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>
                👥 Ver Amigos
              </button>
              <button className={`tab-btn ${activeTab === 'duels' ? 'active' : ''}`} onClick={() => setActiveTab('duels')}>
                ⚔️ Duelos Pre-Mundial
              </button>
              <button className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
                ⚙️ Resultados Reales
              </button>
            </nav>

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
