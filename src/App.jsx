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

const apiTeamNameToSpanish = {
  'Algeria': 'Argelia',
  'Argentina': 'Argentina',
  'Australia': 'Australia',
  'Austria': 'Austria',
  'Belgium': 'Bélgica',
  'Bosnia and Herzegovina': 'Bosnia y Herzegovina',
  'Brazil': 'Brasil',
  'Canada': 'Canadá',
  'Cape Verde': 'Cabo Verde',
  'Colombia': 'Colombia',
  'Croatia': 'Croacia',
  'Curaçao': 'Curazao',
  'Czech Republic': 'República Checa',
  'Democratic Republic of the Congo': 'RD Congo',
  'Ecuador': 'Ecuador',
  'Egypt': 'Egipto',
  'England': 'Inglaterra',
  'France': 'Francia',
  'Germany': 'Alemania',
  'Ghana': 'Ghana',
  'Haiti': 'Haití',
  'Iran': 'Irán',
  'Iraq': 'Irak',
  'Ivory Coast': 'Costa de Marfil',
  'Japan': 'Japón',
  'Jordan': 'Jordania',
  'Mexico': 'México',
  'Morocco': 'Marruecos',
  'Netherlands': 'Países Bajos',
  'New Zealand': 'Nueva Zelanda',
  'Norway': 'Noruega',
  'Panama': 'Panamá',
  'Paraguay': 'Paraguay',
  'Portugal': 'Portugal',
  'Qatar': 'Qatar',
  'Saudi Arabia': 'Arabia Saudita',
  'Scotland': 'Escocia',
  'Senegal': 'Senegal',
  'South Africa': 'Sudáfrica',
  'South Korea': 'Corea del Sur',
  'Spain': 'España',
  'Sweden': 'Suecia',
  'Switzerland': 'Suiza',
  'Tunisia': 'Túnez',
  'Turkey': 'Turquía',
  'United States': 'Estados Unidos',
  'Uruguay': 'Uruguay',
  'Uzbekistan': 'Uzbekistán'
};

function App() {
  const isSupabaseConnected = true;

  // Sincronización horaria del servidor
  const [serverTimeOnLoad, setServerTimeOnLoad] = useState(null);
  const [performanceTimeOnLoad, setPerformanceTimeOnLoad] = useState(null);

  const getSecureDate = () => {
    if (serverTimeOnLoad !== null && !isNaN(serverTimeOnLoad) && performanceTimeOnLoad !== null) {
      const elapsed = performance.now() - performanceTimeOnLoad;
      return new Date(serverTimeOnLoad + elapsed);
    }
    return new Date();
  };

  const parseMatchDate = (dateStr) => {
    // Ej: "11 Jun 2026 - 15:00" o "15 Jun 2026 - 22:00"
    if (!dateStr) return null;
    const parts = dateStr.split(' - ');
    if (parts.length < 2) return null;
    
    const datePart = parts[0];
    const timePart = parts[1];
    
    const dateTokens = datePart.split(' ');
    if (dateTokens.length < 3) return null;
    
    const day = parseInt(dateTokens[0]);
    const monthStr = dateTokens[1];
    const year = parseInt(dateTokens[2]);
    
    const timeTokens = timePart.split(':');
    if (timeTokens.length < 2) return null;
    
    const hours = parseInt(timeTokens[0]);
    const minutes = parseInt(timeTokens[1]);
    
    const months = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    
    const month = months[monthStr] !== undefined ? months[monthStr] : 5;
    
    // Parse using timezone offset -03:00 so it represents the exact absolute epoch time globally
    const pad = (n) => String(n).padStart(2, '0');
    const isoStr = `${year}-${pad(month + 1)}-${pad(day)}T${pad(hours)}:${pad(minutes)}:00-03:00`;
    return new Date(isoStr);
  };

  const sortMatchesChronologically = (matchList) => {
    return [...matchList].sort((a, b) => {
      const dateA = parseMatchDate(a.date || a.match_date);
      const dateB = parseMatchDate(b.date || b.match_date);
      if (!dateA && !dateB) return a.id - b.id;
      if (!dateA) return 1;
      if (!dateB) return -1;
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      return a.id - b.id;
    });
  };

  const isMatchPredictionsClosed = (match) => {
    if (!match) return true;
    if (match.status === 'played' || match.status === 'live') return true;

    const parsedDate = parseMatchDate(match.date || match.match_date);
    if (!parsedDate) return true;

    // Predictions are closed exactly 2 hours before match start time
    const deadline = new Date(parsedDate.getTime() - 2 * 60 * 60 * 1000);
    return getSecureDate() >= deadline;
  };

  const getMatchDeadlineString = (match) => {
    if (!match) return '';
    const parsedDate = parseMatchDate(match.date || match.match_date);
    if (!parsedDate) return '';

    const deadline = new Date(parsedDate.getTime() - 2 * 60 * 60 * 1000);

    try {
      const formatter = new Intl.DateTimeFormat('es-AR', {
        timeZone: 'America/Buenos_Aires',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      // Example formatted: "12 de junio 19:00"
      const formatted = formatter.format(deadline);
      // Clean up extra spaces/prepositions just in case, capitalizing month names if preferred
      // but "12 de junio 19:00" is standard and correct.
      return formatted;
    } catch (e) {
      const monthNamesSpanish = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      // Fallback conversion assuming target timezone is GMT-3
      const gmt3Time = new Date(deadline.getTime() - (3 * 60 * 60 * 1000));
      const day = gmt3Time.getUTCDate();
      const month = gmt3Time.getUTCMonth();
      const hours = String(gmt3Time.getUTCHours()).padStart(2, '0');
      const minutes = String(gmt3Time.getUTCMinutes()).padStart(2, '0');
      return `${day} de ${monthNamesSpanish[month]} ${hours}:${minutes}`;
    }
  };

  const syncServerTime = async () => {
    try {
      const start = performance.now();
      const res = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC', { signal: AbortSignal.timeout(4000) });
      const data = await res.json();
      const serverUtc = data.unixtime ? (data.unixtime * 1000) : new Date(data.utc_datetime).getTime();
      const latency = (performance.now() - start) / 2;
      setServerTimeOnLoad(serverUtc + latency);
      setPerformanceTimeOnLoad(performance.now());
      console.log("Sincronización horaria exitosa:", new Date(serverUtc + latency).toISOString());
    } catch (e) {
      console.warn("Fallo worldtimeapi.org, reintentando con timeapi.io...", e);
      try {
        const start = performance.now();
        const res = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=UTC', { signal: AbortSignal.timeout(4000) });
        const data = await res.json();
        const serverUtc = Date.UTC(data.year, data.month - 1, data.day, data.hour, data.minute, data.seconds, data.milliSeconds);
        const latency = (performance.now() - start) / 2;
        setServerTimeOnLoad(serverUtc + latency);
        setPerformanceTimeOnLoad(performance.now());
        console.log("Sincronización horaria exitosa (fallback):", new Date(serverUtc + latency).toISOString());
      } catch (e2) {
        console.error("Fallo total de sincronización horaria:", e2);
        // Fallback al reloj local si todo falla
        setServerTimeOnLoad(Date.now());
        setPerformanceTimeOnLoad(performance.now());
      }
    }
  };


  // Sesión y Navegación
  const [currentTenant, setCurrentTenant] = useState(null); // { id, name }
  const [currentUser, setCurrentUser] = useState(null); // { id, username, fullName, mysticPhrase, whatsapp, isAdmin, stripeColor1, stripeColor2 }
  const [activeTab, setActiveTab] = useState('predictions'); // 'predictions' | 'leaderboard' | 'friends' | 'admin'
  const [hasRedirected, setHasRedirected] = useState(false);
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
  const [editPatternInput, setEditPatternInput] = useState('diagonal');

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
  const [activeLosingDuelId, setActiveLosingDuelId] = useState(null);
  const [loserResponseText, setLoserResponseText] = useState('');
  const [showLoserResponseModal, setShowLoserResponseModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Restaurar sesión guardada de localStorage al iniciar la app
  useEffect(() => {
    const storedTenant = localStorage.getItem('caseros_prode_tenant');
    const storedUser = localStorage.getItem('caseros_prode_user');
    if (storedTenant) {
      try {
        const parsedTenant = JSON.parse(storedTenant);
        setCurrentTenant(parsedTenant);
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setCurrentUser(parsedUser);
        }
      } catch (e) {
        console.error("Error restaurando sesión de localStorage:", e);
      }
    }
  }, []);

  // Redirección inteligente al ingresar (primer partido por disputarse)
  useEffect(() => {
    if (currentUser && currentTenant && matches.length > 0 && !hasRedirected) {
      setActiveTab('predictions');
      setCurrentMatchIndex(getFirstUpcomingMatchIndex());
      setHasRedirected(true);
    }
  }, [currentUser, currentTenant, matches, hasRedirected]);

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
  const [boludeoEventsList, setBoludeoEventsList] = useState([]);

  // Formularios de entrada
  const [newTenantName, setNewTenantName] = useState('');
  
  // Registro
  const [newUserName, setNewUserName] = useState(''); // Apodo
  const [newUserFullName, setNewUserFullName] = useState(''); // Nombre completo
  const [newUserMystic, setNewUserMystic] = useState(''); // Frase mística
  const [newUserWhatsapp, setNewUserWhatsapp] = useState(''); // Whatsapp (8 digitos)
  const [newUserPin, setNewUserPin] = useState(''); // PIN (4 digitos)
  const [isAdminRegister, setIsAdminRegister] = useState(false);

  // Recuperación de PIN y Base de Datos dinámica
  const [dbHasRecoveryColumns, setDbHasRecoveryColumns] = useState(false);
  const [regRecoveryQuestion, setRegRecoveryQuestion] = useState("¿En tu equipo glorioso, cuál es el número de tu camiseta?");
  const [regRecoveryAnswer, setRegRecoveryAnswer] = useState('');
  
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryWhatsapp, setRecoveryWhatsapp] = useState('');
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: whatsapp, 2: pregunta, 3: revelar
  const [recoveryUser, setRecoveryUser] = useState(null);
  const [recoveryAnswerInput, setRecoveryAnswerInput] = useState('');
  const [recoveredPin, setRecoveredPin] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  // Login
  const [loginWhatsapp, setLoginWhatsapp] = useState(''); // Whatsapp (8 digitos)
  const [loginPin, setLoginPin] = useState(''); // PIN (4 digitos)
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [loginBtnText, setLoginBtnText] = useState('Iniciar Sesión');
  const [selectedTenantId, setSelectedTenantId] = useState('caseros2026');

  const BANTER_LOGIN_PHRASES = [
    "Entra, Gil ⚽",
    "Entrar a perder 📉",
    "Ingresar (si te da el cuero) 😏",
    "Hacer el ridículo 🤡",
    "Entrar al fondo de la tabla 📉",
    "Dar lástima un rato 🩴",
    "Entra a ver cómo gano 🏆"
  ];

  useEffect(() => {
    if (currentTenant) {
      const idx = Math.floor(Math.random() * BANTER_LOGIN_PHRASES.length);
      setLoginBtnText(BANTER_LOGIN_PHRASES[idx]);
    }
  }, [currentTenant]);

  // Carga inicial y listeners de DB
  useEffect(() => {
    syncServerTime();
    fetchInitialData();
    checkRecoveryColumns();
  }, []);

  // Sincronización automática de resultados en vivo cada 5 minutos
  useEffect(() => {
    if (matches.length > 0) {
      syncLiveScores();
      const interval = setInterval(() => {
        syncLiveScores();
      }, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [matches.length]);

  const checkRecoveryColumns = async () => {
    if (isSupabaseConnected && supabase) {
      try {
        const { error } = await supabase
          .from('participants')
          .select('recovery_question, recovery_answer, recovery_log')
          .limit(1);
        if (!error) {
          setDbHasRecoveryColumns(true);
        } else {
          console.warn("Columnas de recuperación no detectadas en Supabase:", error.message);
          setDbHasRecoveryColumns(false);
        }
      } catch (e) {
        setDbHasRecoveryColumns(false);
      }
    }
  };

  const getFirstIncompleteMatchIndex = (userPreds) => {
    const isPhase1Closed = new Date() >= new Date('2026-06-10T23:59:00');
    const isPhase2Closed = new Date() >= new Date('2026-06-28T00:00:00');
    
    if (isPhase2Closed) {
      return -1;
    }
    
    if (!isPhase1Closed) {
      // Solo consideramos los partidos de la Fase 1
      return matches.findIndex(m => {
        const stage = m.stage || (m.id >= 73 ? 2 : 1);
        if (stage !== 1) return false;
        const pred = userPreds[m.id];
        return !pred || pred.scoreA === '' || pred.scoreA === null || pred.scoreB === '' || pred.scoreB === null;
      });
    } else {
      // Fase 1 cerrada, consideramos partidos de la Fase 2 (Fase Final)
      return matches.findIndex(m => {
        const stage = m.stage || (m.id >= 73 ? 2 : 1);
        if (stage !== 2) return false;
        const pred = userPreds[m.id];
        return !pred || pred.scoreA === '' || pred.scoreA === null || pred.scoreB === '' || pred.scoreB === null;
      });
    }
  };

  const getFirstUpcomingMatchIndex = () => {
    const idx = matches.findIndex(m => !isMatchPredictionsClosed(m));
    return idx !== -1 ? idx : 0;
  };

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

  // Polling para refrescar los duelos y desafíos en tiempo real cada 8 segundos
  useEffect(() => {
    if (!currentTenant) return;
    
    // Carga inicial
    loadDuelsForTenant(currentTenant.id);

    const timer = setInterval(() => {
      loadDuelsForTenant(currentTenant.id);
    }, 8000);

    return () => clearInterval(timer);
  }, [currentTenant]);

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
          const hasStageColumn = dbMatches.length > 0 && ('stage' in dbMatches[0]);

          // Si el total en la DB es menor que el fixture configurado, o si los equipos de algún partido
          // no coinciden (por ejemplo, por cambios en el sorteo oficial), actualizamos/upserteamos el fixture.
          const needsUpdate = dbMatches.length < initialMatches.length || dbMatches.some(dbM => {
            const initM = initialMatches.find(im => im.id === dbM.id);
            return initM && (initM.teamA !== dbM.team_a || initM.teamB !== dbM.team_b);
          });

          if (needsUpdate) {
            const dbSeed = initialMatches.map(m => {
              const row = {
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
              };
              if (hasStageColumn) {
                row.stage = m.stage;
              }
              return row;
            });
            await supabase.from('matches').upsert(dbSeed);
            
            // Volver a cargar para tener todos los partidos sincronizados
            let { data: reloadedMatches } = await supabase.from('matches').select('*').order('id', { ascending: true });
            if (reloadedMatches && reloadedMatches.length > 0) {
              dbMatches = reloadedMatches;
            }
          }

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
            status: m.status,
            stage: m.stage !== undefined ? m.stage : (m.id >= 73 ? 2 : 1)
          }));
          setMatches(sortMatchesChronologically(mappedMatches));
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
            status: m.status,
            stage: m.stage
          }));
          const { error } = await supabase.from('matches').insert(dbSeed);
          if (error) {
            // Reintentar sin la columna stage por si el usuario no ha corrido la migración SQL todavía
            const fallbackSeed = dbSeed.map(({ stage, ...rest }) => rest);
            await supabase.from('matches').insert(fallbackSeed);
          }
          setMatches(sortMatchesChronologically(initialMatches));
        }

        // Cargar Pronósticos
        let { data: dbPreds } = await supabase.from('predictions').select('*');
        const formattedPreds = {};
        dbPreds?.forEach(p => {
          // Guardar por ID si existe
          if (p.participant_id) {
            const keyId = `${p.tenant_id}_${p.participant_id}`;
            if (!formattedPreds[keyId]) formattedPreds[keyId] = {};
            formattedPreds[keyId][p.match_id] = { scoreA: p.score_a, scoreB: p.score_b, penalWinner: p.penal_winner };
          }
          // Guardar por username si existe
          if (p.participant_username) {
            const keyUser = `${p.tenant_id}_${(p.participant_username || '').trim()}`;
            if (!formattedPreds[keyUser]) formattedPreds[keyUser] = {};
            formattedPreds[keyUser][p.match_id] = { scoreA: p.score_a, scoreB: p.score_b, penalWinner: p.penal_winner };
          }
          // Fallback por si acaso
          if (!p.participant_id && !p.participant_username) {
            const keyUndef = `${p.tenant_id}_undefined`;
            if (!formattedPreds[keyUndef]) formattedPreds[keyUndef] = {};
            formattedPreds[keyUndef][p.match_id] = { scoreA: p.score_a, scoreB: p.score_b, penalWinner: p.penal_winner };
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
    loadBoludeoEventsForTenant(currentTenant.id);
  }, [currentTenant]);

  const loadBoludeoEventsForTenant = async (tenantId) => {
    if (isSupabaseConnected && supabase) {
      try {
        const { data, error } = await supabase
          .from('boludeo_events')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });
        if (!error && data) {
          setBoludeoEventsList(data);
        }
      } catch (err) {
        console.error("Error al cargar eventos de boludeo:", err);
      }
    }
  };

  const loadParticipantsForTenant = async (tenantId) => {
    if (isSupabaseConnected && supabase) {
      try {
        let { data } = await supabase.from('participants').select('*').eq('tenant_id', tenantId);
        const resolvedParticipants = data || [];
        setParticipants(resolvedParticipants);

        if (resolvedParticipants.length === 0) {
          setIsAdminRegister(true);
        } else {
          setIsAdminRegister(false);
        }

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

    // Seleccionar una chicana al azar de forma automática por el sistema
    const randomIdx = Math.floor(Math.random() * banterPhrases.length);
    const chosenChicana = banterPhrases[randomIdx];

    const newDuel = {
      tenant_id: currentTenant.id,
      challenger_username: currentUser.username,
      opponent_username: opponentSearch,
      challenger_move: duelMove,
      challenger_message: chosenChicana,
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

  const handleSendLoserResponse = async (e, duelId, responseText) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!responseText || !duelId) return;

    let updatedRemote = false;
    if (isSupabaseConnected && supabase && !duelId.toString().startsWith('local_')) {
      try {
        const { error } = await supabase
          .from('mini_duels')
          .update({ loser_response: responseText })
          .eq('id', duelId);
        
        if (!error) {
          updatedRemote = true;
          alert('📝 Descargo enviado con éxito.');
          setShowLoserResponseModal(false);
          setLoserResponseText('');
          setActiveLosingDuelId(null);
          if (currentTenant) {
            await loadDuelsForTenant(currentTenant.id);
          }
        } else {
          console.error(error);
          alert('Error al enviar descargo a Supabase.');
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (!updatedRemote) {
      if (currentTenant) {
        const currentLocal = localStorage.getItem(`local_duels_${currentTenant.id}`);
        if (currentLocal) {
          const duelsList = JSON.parse(currentLocal);
          const idx = duelsList.findIndex(d => d.id === duelId);
          if (idx !== -1) {
            duelsList[idx].loser_response = responseText;
            localStorage.setItem(`local_duels_${currentTenant.id}`, JSON.stringify(duelsList));
            setDuels(duelsList);
          }
        }
        alert('📝 Descargo enviado con éxito (Local).');
        setShowLoserResponseModal(false);
        setLoserResponseText('');
        setActiveLosingDuelId(null);
      }
    }
  };

  // Reglas de puntuación
  const calculatePoints = (pred, actual) => {
    if ((actual.status !== 'played' && actual.status !== 'live') || actual.actualScoreA === null || actual.actualScoreB === null || actual.actualScoreA === undefined || actual.actualScoreB === undefined) {
      return 0;
    }
    if (!pred || pred.scoreA === null || pred.scoreB === null || pred.scoreA === undefined || pred.scoreB === undefined || pred.scoreA === '' || pred.scoreB === '') {
      return 0;
    }

    const pA = parseInt(pred.scoreA);
    const pB = parseInt(pred.scoreB);
    const aA = parseInt(actual.actualScoreA);
    const aB = parseInt(actual.actualScoreB);

    if (isNaN(pA) || isNaN(pB) || isNaN(aA) || isNaN(aB)) {
      return 0;
    }

    const predOutcome = pA > pB ? 1 : pA < pB ? 2 : 0;
    const actualOutcome = aA > aB ? 1 : aA < aB ? 2 : 0;

    let points = 0;
    const outcomeMatch = predOutcome === actualOutcome;
    const exactLocal = pA === aA;
    const exactAway = pB === aB;

    if (outcomeMatch) points += 3;
    if (exactLocal) points += 1;
    if (exactAway) points += 1;
    if (exactLocal && exactAway) points += 2; // Perfect score bonus

    return points;
  };

  // Calcular tabla de posiciones por fase
  const getLeaderboardByStage = (stageNum) => {
    if (!currentTenant) return [];
    const list = participants;
    const ranked = list.map(user => {
      let totalPoints = 0;
      let exactScores = 0;
      let correctOutcomes = 0;

      const userPreds = predictions[`${currentTenant.id}_${user.id}`] || predictions[`${currentTenant.id}_${(user.username || '').trim()}`] || {};

      matches.forEach(match => {
        const matchStage = match.stage || (match.id >= 73 ? 2 : 1);
        if (matchStage === stageNum && (match.status === 'played' || match.status === 'live')) {
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

  const getLeaderboardDuels = () => {
    if (!currentTenant) return [];
    const list = participants;
    const ranked = list.map(user => {
      const duelsWon = duels.filter(d => d.winner_username === user.username && d.status === 'completed').length;
      const duelsPlayed = duels.filter(d => (d.challenger_username === user.username || d.opponent_username === user.username) && d.status === 'completed').length;
      
      return {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        mysticPhrase: user.mystic_phrase,
        whatsapp: user.whatsapp,
        stripeColor1: user.stripe_color_1,
        stripeColor2: user.stripe_color_2,
        pattern: user.pattern || 'diagonal',
        points: duelsWon * 2,
        duelsWon,
        duelsPlayed
      };
    });

    return ranked.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.duelsWon !== a.duelsWon) return b.duelsWon - a.duelsWon;
      return (a.username || '').localeCompare(b.username || '');
    });
  };

  const leaderboardPhase1 = getLeaderboardByStage(1);
  const leaderboardPhase2 = getLeaderboardByStage(2);
  const leaderboardDuels = getLeaderboardDuels();

  // Determinar la tabla de posiciones activa para los castigos visuales (Fase 2 si ya empezó y hay partidos jugados con puntajes, sino Fase 1)
  const hasPhase2MatchesPlayed = matches.some(m => (m.stage === 2 || m.id >= 73) && (m.status === 'played' || m.status === 'live') && m.actualScoreA !== null && m.actualScoreB !== null);
  const leaderboard = hasPhase2MatchesPlayed ? leaderboardPhase2 : leaderboardPhase1;

  // Buscar si el usuario actual sufre el castigo (mitad inferior)
  const loggedInRankIndex = leaderboard.findIndex(p => p.id === currentUser?.id);
  const isInBottomHalf = currentUser && leaderboard.length >= 2 && loggedInRankIndex >= Math.ceil(leaderboard.length / 2);
  const leaderUser = leaderboard[0] || null;

  // Colores de castigo del Puesto #1
  const punishmentColor1 = leaderUser?.stripeColor1 || '#ff0055';
  const punishmentColor2 = leaderUser?.stripeColor2 || '#00ff87';

  // Lógica para disparar popup de chicana
  const triggerBanterPopup = (user) => {
    const board = leaderboard;
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
    alert('Comunicate con el Negro antes de hacer macanas');
  };

  // Registrar nuevo participante
  const handleRegisterUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserFullName.trim() || !newUserWhatsapp.trim() || !newUserPin.trim() || !currentTenant) return;

    const cleanWhatsapp = newUserWhatsapp.replace(/\D/g, '').slice(-8);
    const cleanPin = newUserPin.replace(/\D/g, '').slice(-4);

    if (cleanWhatsapp.length !== 8) {
      alert('Metiste mal los garfios. El número de WhatsApp debe tener al menos 8 dígitos.');
      return;
    }
    if (cleanPin.length !== 4) {
      alert('Me parece que alguien necesita lentes... El PIN debe tener exactamente 4 dígitos.');
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
      stripe_color_2: '#00ff87',
      ...(dbHasRecoveryColumns ? {
        recovery_question: regRecoveryQuestion,
        recovery_answer: regRecoveryAnswer.trim().toLowerCase(),
        recovery_log: []
      } : {})
    };

    const proceedRegisterSuccess = async (registeredUser) => {
      setNewUserName('');
      setNewUserFullName('');
      setNewUserMystic('');
      setNewUserWhatsapp('');
      setNewUserPin('');
      setRegRecoveryAnswer('');
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
      localStorage.setItem('caseros_prode_user', JSON.stringify(loggedUser));
      localStorage.setItem('caseros_prode_tenant', JSON.stringify(currentTenant));
      await loadParticipantsForTenant(currentTenant.id);
      await loadDuelsForTenant(currentTenant.id);
      
      const randomIdx = Math.floor(Math.random() * welcomeBanterPhrases.length);
      setWelcomePopupMessage(welcomeBanterPhrases[randomIdx]);
      setShowWelcomePopup(true);
      
      setActiveTab('predictions');
    };

    if (isSupabaseConnected && supabase) {
      try {
        const { data, error } = await supabase.from('participants').insert(newUser).select();
        if (error) {
          // Si falló por falta de columnas de recuperación, reintentamos sin ellas
          if ((error.code === '42703' || error.message?.includes('recovery')) && dbHasRecoveryColumns) {
            console.warn("Fallo con columnas de recuperación. Reintentando registro básico.");
            const fallbackUser = { ...newUser };
            delete fallbackUser.recovery_question;
            delete fallbackUser.recovery_answer;
            delete fallbackUser.recovery_log;
            const { data: retryData, error: retryError } = await supabase.from('participants').insert(fallbackUser).select();
            if (retryError) throw retryError;
            if (retryData && retryData.length > 0) {
              await proceedRegisterSuccess(retryData[0]);
            }
          } else {
            throw error;
          }
        } else if (data && data.length > 0) {
          await proceedRegisterSuccess(data[0]);
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

    if (cleanWhatsapp.length !== 8) {
      alert('Metiste mal los garfios. El número de WhatsApp debe tener al menos 8 dígitos.');
      return;
    }
    if (cleanPin.length !== 4) {
      alert('Me parece que alguien necesita lentes... El PIN debe tener exactamente 4 dígitos.');
      return;
    }

    const found = participants.find(p => p.whatsapp === cleanWhatsapp && p.pin === cleanPin);
    if (!found) {
      // 40% de probabilidad de mostrar la frase de Macachin/La Rioja
      if (Math.random() < 0.40) {
        alert("Me parece que vos debes ser de Macachin, o de La Rioja... Vola de aca, pajarito!");
      } else {
        const standardBanter = [
          "¿Y vos quién sos? ¿Quién te conoce? 🧐",
          "Me parece que alguien necesita lentes... 👓",
          "Metiste mal los garfios ⌨️",
          "Esa combinación no existe acá, patadura. 🩴",
          "¡Alerta de impostor! Le erraste al WhatsApp o al PIN. 🚨"
        ];
        const idx = Math.floor(Math.random() * standardBanter.length);
        alert(standardBanter[idx]);
      }
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
    localStorage.setItem('caseros_prode_user', JSON.stringify(loggedUser));
    localStorage.setItem('caseros_prode_tenant', JSON.stringify(currentTenant));
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
          stripe_color_2: editColor2Input,
          pattern: editPatternInput
        };

        let { error } = await supabase.from('participants')
          .update(updates)
          .eq('id', currentUser.id);

        if (error && (error.code === '42703' || error.code === 'PGRST104' || error.message?.toLowerCase().includes('pattern'))) {
          // Si la columna 'pattern' no existe en la base de datos, reintentamos excluyéndola
          const { pattern, ...updatesWithoutPattern } = updates;
          const retry = await supabase.from('participants')
            .update(updatesWithoutPattern)
            .eq('id', currentUser.id);
          error = retry.error;
        }

        if (error) throw error;

        // Si cambiamos el apodo (username), también debemos migrar las predicciones y duelos en la BD
        if (editNickInput !== currentUser.username) {
          try {
            await supabase.from('predictions')
              .update({ participant_username: editNickInput })
              .eq('participant_username', currentUser.username)
              .eq('tenant_id', currentTenant.id);

            await supabase.from('mini_duels')
              .update({ challenger_username: editNickInput })
              .eq('challenger_username', currentUser.username)
              .eq('tenant_id', currentTenant.id);

            await supabase.from('mini_duels')
              .update({ opponent_username: editNickInput })
              .eq('opponent_username', currentUser.username)
              .eq('tenant_id', currentTenant.id);

            await supabase.from('mini_duels')
              .update({ winner_username: editNickInput })
              .eq('winner_username', currentUser.username)
              .eq('tenant_id', currentTenant.id);
          } catch (migErr) {
            console.error("Error al migrar apodo en cascada:", migErr);
          }
        }

        const updatedUser = {
          ...currentUser,
          username: editNickInput,
          mysticPhrase: editMysticInput,
          stripeColor1: editColor1Input,
          stripeColor2: editColor2Input,
          pattern: editPatternInput
        };
        setCurrentUser(updatedUser);
        localStorage.setItem('caseros_prode_user', JSON.stringify(updatedUser));
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

    // Validación de fecha límite dinámica
    const targetMatch = matches.find(m => m.id === matchId);
    if (isMatchPredictionsClosed(targetMatch)) {
      alert('La carga y modificación de pronósticos para este partido finalizó el día anterior a su juego.');
      return;
    }

    const parsedVal = team === 'penalWinner' ? value : (value === '' ? '' : parseInt(value));
    const keyId = `${currentTenant.id}_${currentUser.id}`;
    const keyUsername = `${currentTenant.id}_${(currentUser.username || '').trim()}`;
    const userPreds = predictions[keyId] || predictions[keyUsername] || {};
    const matchPred = userPreds[matchId] || { scoreA: '', scoreB: '', penalWinner: null };

    // Si los goles cambian y ya no es un empate, remover el penalWinner
    let finalPenalWinner = team === 'penalWinner' ? parsedVal : (matchPred.penalWinner || null);
    if (team === 'scoreA' || team === 'scoreB') {
      const nextScoreA = team === 'scoreA' ? parsedVal : matchPred.scoreA;
      const nextScoreB = team === 'scoreB' ? parsedVal : matchPred.scoreB;
      if (nextScoreA !== '' && nextScoreB !== '' && nextScoreA !== nextScoreB) {
        finalPenalWinner = null;
      }
    }

    const updatedPred = {
      ...matchPred,
      [team]: parsedVal,
      penalWinner: finalPenalWinner
    };

    // 1. Actualizar el estado local inmediatamente (No bloquea la UI/teclado)
    setPredictions(prev => {
      const next = { ...prev };
      const nextKeyId = { ...(next[keyId] || {}) };
      const nextKeyUsername = { ...(next[keyUsername] || {}) };
      
      nextKeyId[matchId] = updatedPred;
      nextKeyUsername[matchId] = updatedPred;
      
      next[keyId] = nextKeyId;
      next[keyUsername] = nextKeyUsername;
      return next;
    });

    // 2. Guardar en base de datos de manera asíncrona
    if (isSupabaseConnected && supabase) {
      const predictionRow = {
        tenant_id: currentTenant.id,
        match_id: matchId,
        score_a: team === 'scoreA' ? (parsedVal === '' ? null : parseInt(parsedVal)) : (matchPred.scoreA === '' ? null : parseInt(matchPred.scoreA)),
        score_b: team === 'scoreB' ? (parsedVal === '' ? null : parseInt(parsedVal)) : (matchPred.scoreB === '' ? null : parseInt(matchPred.scoreB)),
        penal_winner: finalPenalWinner
      };

      // Ejecutar la escritura en segundo plano sin suspender la interfaz
      (async () => {
        try {
          const { error } = await supabase.from('predictions').upsert({
            ...predictionRow,
            participant_id: currentUser.id
          }, { onConflict: 'tenant_id,participant_id,match_id' });

          if (error && (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('participant_id'))) {
            const { error: fallbackError } = await supabase.from('predictions').upsert({
              ...predictionRow,
              participant_username: currentUser.username
            }, { onConflict: 'tenant_id,participant_username,match_id' });
            if (fallbackError) console.error("Error en fallback de base de datos:", fallbackError);
          } else if (error) {
            console.error("Error en base de datos:", error);
          }
        } catch (dbErr) {
          console.error("Error asíncrono al guardar pronóstico:", dbErr);
        }
      })();
    }
  };

  // Moderación de chicanas por el Admin
  const handleModerateBoludeoEvent = async (eventId) => {
    const deletedPlaceholder = "Borrado por el Admin (Se había ido al pasto...)";
    if (isSupabaseConnected && supabase) {
      try {
        const { error } = await supabase
          .from('boludeo_events')
          .update({ message: deletedPlaceholder })
          .eq('id', eventId);
        if (error) throw error;
        await loadBoludeoEventsForTenant(currentTenant.id);
        alert('Mensaje de chicana moderado con éxito.');
      } catch (err) {
        alert('Error al moderar chicana: ' + err.message);
      }
    } else {
      setBoludeoEventsList(prev => prev.map(e => e.id === eventId ? { ...e, message: deletedPlaceholder } : e));
      alert('Mensaje de chicana moderado localmente.');
    }
  };

  // Moderación de descargos de duelos por el Admin
  const handleModerateDuelResponse = async (duelId) => {
    const deletedPlaceholder = "Borrado por el Admin (Se había ido al pasto...)";
    if (isSupabaseConnected && supabase) {
      try {
        const { error } = await supabase
          .from('mini_duels')
          .update({ loser_response: deletedPlaceholder })
          .eq('id', duelId);
        if (error) throw error;
        await loadDuelsForTenant(currentTenant.id);
        alert('Descargo de duelo moderado con éxito.');
      } catch (err) {
        alert('Error al moderar descargo: ' + err.message);
      }
    } else {
      setDuels(prev => prev.map(d => d.id === duelId ? { ...d, loser_response: deletedPlaceholder } : d));
      alert('Descargo de duelo moderado localmente.');
    }
  };

  const handleResetParticipantPin = async (participantId, username) => {
    if (!window.confirm(`¿Estás seguro de restablecer el PIN de ${username} a "1234"?`)) return;

    if (isSupabaseConnected && supabase) {
      try {
        const { error } = await supabase
          .from('participants')
          .update({ pin: '1234' })
          .eq('id', participantId);
        if (error) throw error;
        
        // Si el usuario restablecido es el usuario actual, actualizar localmente
        if (currentUser && currentUser.id === participantId) {
          const updatedUser = { ...currentUser, pin: '1234' };
          setCurrentUser(updatedUser);
          localStorage.setItem('caseros_prode_user', JSON.stringify(updatedUser));
        }

        setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, pin: '1234' } : p));
        alert(`Se ha restablecido el PIN de ${username} a "1234".`);
      } catch (err) {
        alert('Error al restablecer PIN: ' + err.message);
      }
    } else {
      setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, pin: '1234' } : p));
      alert(`PIN de ${username} restablecido localmente a "1234".`);
    }
  };

  const handleOpenRecovery = () => {
    setRecoveryWhatsapp('');
    setRecoveryStep(1);
    setRecoveryUser(null);
    setRecoveryAnswerInput('');
    setRecoveredPin('');
    setRecoveryError('');
    setShowRecoveryModal(true);
  };

  const handleLookupWhatsapp = () => {
    const cleanWhatsapp = recoveryWhatsapp.replace(/\D/g, '').slice(-8);
    if (cleanWhatsapp.length !== 8) {
      setRecoveryError('Ingresa un número de WhatsApp de 8 dígitos.');
      return;
    }
    setRecoveryError('');

    const found = participants.find(p => p.whatsapp === cleanWhatsapp);
    if (!found) {
      setRecoveryError('No se encontró ningún participante con ese WhatsApp en este grupo.');
      return;
    }

    if (!found.recovery_question) {
      setRecoveryError('Este participante no tiene configurada una pregunta de recuperación.');
      return;
    }

    setRecoveryUser(found);
    setRecoveryStep(2);
  };

  const handleVerifyRecoveryAnswer = async () => {
    if (!recoveryUser) return;
    setRecoveryError('');

    const answerDb = (recoveryUser.recovery_answer || '').trim().toLowerCase();
    const answerInput = recoveryAnswerInput.trim().toLowerCase();

    if (answerDb !== answerInput) {
      setRecoveryError('Respuesta incorrecta. Inténtalo de nuevo.');
      return;
    }

    // Respuesta correcta: Registrar log de fecha y revelar PIN
    const logArray = Array.isArray(recoveryUser.recovery_log) ? recoveryUser.recovery_log : [];
    const updatedLog = [...logArray, new Date().toISOString()];

    if (isSupabaseConnected && supabase && dbHasRecoveryColumns) {
      try {
        await supabase.from('participants')
          .update({ recovery_log: updatedLog })
          .eq('id', recoveryUser.id);
      } catch (err) {
        console.error("Error al registrar log de recuperación en base de datos:", err);
      }
    }

    // Actualizar participantes localmente
    setParticipants(prev => prev.map(p => p.id === recoveryUser.id ? { ...p, recovery_log: updatedLog } : p));

    setRecoveredPin(recoveryUser.pin);
    setRecoveryStep(3);
  };

  // Actualizar participante por el Admin
  const handleUpdateParticipantAdmin = async (participantId, newFullName) => {
    if (!currentUser?.isAdmin) return;
    if (!newFullName.trim()) {
      alert("El nombre completo no puede estar vacío.");
      return;
    }
    if (isSupabaseConnected && supabase) {
      try {
        const { error } = await supabase
          .from('participants')
          .update({ full_name: newFullName })
          .eq('id', participantId);
        if (error) throw error;
        alert('Nombre del participante actualizado con éxito.');
        await loadParticipantsForTenant(currentTenant.id);
      } catch (err) {
        alert('Error al actualizar participante: ' + err.message);
      }
    } else {
      setParticipants(prev => prev.map(p => p.id === participantId ? { ...p, full_name: newFullName } : p));
      alert('Nombre del participante actualizado localmente.');
    }
  };

  // Eliminar participante por el Admin
  const handleDeleteParticipantAdmin = async (participantId, username) => {
    if (!currentUser?.isAdmin) return;
    if (!window.confirm(`¿Estás seguro de que quieres eliminar a "${username}"? Se borrarán permanentemente todos sus pronósticos y duelos.`)) {
      return;
    }
    if (isSupabaseConnected && supabase) {
      try {
        // Borrar chicanas creadas por el usuario
        await supabase.from('boludeo_events').delete().eq('triggered_by_username', username);
        // Borrar duelos del usuario
        await supabase.from('mini_duels').delete().eq('challenger_username', username);
        await supabase.from('mini_duels').delete().eq('opponent_username', username);
        // Borrar predicciones del usuario
        await supabase.from('predictions').delete().eq('participant_id', participantId);
        await supabase.from('predictions').delete().eq('participant_username', username);
        // Borrar participante
        const { error } = await supabase
          .from('participants')
          .delete()
          .eq('id', participantId);
        if (error) throw error;
        alert('Participante eliminado con éxito.');
        await loadParticipantsForTenant(currentTenant.id);
      } catch (err) {
        alert('Error al eliminar participante: ' + err.message);
      }
    } else {
      setParticipants(prev => prev.filter(p => p.id !== participantId));
      setPredictions(prev => {
        const next = { ...prev };
        delete next[`${currentTenant.id}_${participantId}`];
        delete next[`${currentTenant.id}_${username}`];
        return next;
      });
      alert('Participante eliminado localmente.');
    }
  };

  // Exportar backup de pronósticos de usuario individual (JSON)
  const handleExportUserBackup = () => {
    if (!currentUser || !currentTenant) return;
    const userKeyId = `${currentTenant.id}_${currentUser.id}`;
    const userKeyUsername = `${currentTenant.id}_${(currentUser.username || '').trim()}`;
    const userPreds = predictions[userKeyId] || predictions[userKeyUsername] || {};

    const backupData = {
      backup_type: 'single_user',
      tenant_id: currentTenant.id,
      username: currentUser.username,
      whatsapp: currentUser.whatsapp,
      predictions: userPreds,
      exported_at: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `prode_backup_${currentUser.username}_${currentTenant.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Importar backup de pronósticos de usuario individual (JSON)
  const handleImportUserBackup = (e) => {
    if (!currentUser || !currentTenant) return;
    
    // VALIDACIÓN DE FECHA LÍMITE GENERAL: Si ya pasó el cierre de Fase 2, todo está cerrado
    const closingTimePhase2 = new Date('2026-06-28T00:00:00');
    if (new Date() >= closingTimePhase2) {
      alert('La importación y modificación de todos los pronósticos ha finalizado.');
      return;
    }
    
    const fileReader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;
    
    fileReader.onload = async (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);
        
        if (!parsedData.predictions || (parsedData.backup_type !== 'single_user' && parsedData.backup_type !== 'group_all')) {
          alert('Archivo de copia de seguridad no válido.');
          return;
        }

        if (parsedData.backup_type === 'single_user' && parsedData.username !== currentUser.username) {
          if (!window.confirm(`Este backup pertenece al usuario "${parsedData.username}". ¿Estás seguro de que quieres importarlo para tu usuario "${currentUser.username}"?`)) {
            return;
          }
        }

        const predsToImport = parsedData.predictions;
        
        // Filtrar pronósticos para importar solo los de partidos no cerrados
        const filteredPredsToImport = {};
        Object.keys(predsToImport).forEach(matchId => {
          const mIdInt = parseInt(matchId);
          const targetMatch = matches.find(m => m.id === mIdInt);
          if (!isMatchPredictionsClosed(targetMatch)) {
            filteredPredsToImport[matchId] = predsToImport[matchId];
          }
        });

        const matchIds = Object.keys(filteredPredsToImport);
        
        if (matchIds.length === 0) {
          alert('El archivo no contiene pronósticos válidos o todos los partidos ya se encuentran cerrados.');
          return;
        }

        let successCount = 0;
        
        if (isSupabaseConnected && supabase) {
          for (const matchId of matchIds) {
            const pred = filteredPredsToImport[matchId];
            if (pred && (pred.scoreA !== '' && pred.scoreA !== null && pred.scoreB !== '' && pred.scoreB !== null)) {
              try {
                const scoreAVal = parseInt(pred.scoreA);
                const scoreBVal = parseInt(pred.scoreB);
                const predictionRow = {
                  tenant_id: currentTenant.id,
                  match_id: parseInt(matchId),
                  score_a: isNaN(scoreAVal) ? null : scoreAVal,
                  score_b: isNaN(scoreBVal) ? null : scoreBVal,
                };
                
                let { error } = await supabase.from('predictions').upsert({
                  ...predictionRow,
                  participant_id: currentUser.id
                }, { onConflict: 'tenant_id,participant_id,match_id' });
                
                if (error && (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('participant_id'))) {
                  const { error: fallbackError } = await supabase.from('predictions').upsert({
                    ...predictionRow,
                    participant_username: currentUser.username
                  }, { onConflict: 'tenant_id,participant_username,match_id' });
                  if (fallbackError) throw fallbackError;
                }
                successCount++;
              } catch (upsertErr) {
                console.error(`Error al importar partido #${matchId}:`, upsertErr);
              }
            }
          }
        }
        
        // Actualizar el estado local
        const keyId = `${currentTenant.id}_${currentUser.id}`;
        const keyUsername = `${currentTenant.id}_${currentUser.username}`;
        
        setPredictions(prev => ({
          ...prev,
          [keyId]: {
            ...prev[keyId],
            ...filteredPredsToImport
          },
          [keyUsername]: {
            ...prev[keyUsername],
            ...filteredPredsToImport
          }
        }));

        alert(`¡Importación completada! Se procesaron ${successCount} pronósticos en la base de datos.`);
        fetchInitialData();
      } catch (err) {
        alert('Error al leer el archivo de copia de seguridad: ' + err.message);
      }
    };
    fileReader.readAsText(file, "UTF-8");
  };

  // Exportar backup global de todas las predicciones del grupo (JSON)
  const handleExportGroupBackup = () => {
    if (!currentUser?.isAdmin || !currentTenant) return;
    
    // Obtener predicciones asociadas al tenant actual
    const tenantPredictions = {};
    Object.keys(predictions).forEach(key => {
      if (key.startsWith(`${currentTenant.id}_`)) {
        tenantPredictions[key] = predictions[key];
      }
    });

    const backupData = {
      backup_type: 'group_all',
      tenant_id: currentTenant.id,
      predictions: tenantPredictions,
      participants: participants.map(p => ({
        username: p.username,
        full_name: p.full_name,
        whatsapp: p.whatsapp,
        mystic_phrase: p.mystic_phrase
      })),
      exported_at: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `prode_RESPALDO_TOTAL_${currentTenant.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Guardar puntuación de partido de forma manual por el Admin
  const handleSaveMatchScoreManual = async (matchId, scoreA, scoreB, status, teamA, flagA, teamB, flagB) => {
    if (!currentUser?.isAdmin) {
      alert("Solo el administrador puede actualizar los resultados oficiales.");
      return;
    }

    const parsedA = scoreA === '' || scoreA === null ? null : parseInt(scoreA);
    const parsedB = scoreB === '' || scoreB === null ? null : parseInt(scoreB);

    if (isSupabaseConnected && supabase) {
      try {
        const updatePayload = {
          actual_score_a: parsedA,
          actual_score_b: parsedB,
          status: status
        };
        if (teamA !== undefined) updatePayload.team_a = teamA;
        if (flagA !== undefined) updatePayload.flag_a = flagA;
        if (teamB !== undefined) updatePayload.team_b = teamB;
        if (flagB !== undefined) updatePayload.flag_b = flagB;

        const { error } = await supabase
          .from('matches')
          .update(updatePayload)
          .eq('id', matchId);
        if (error) throw error;
        alert("Partido actualizado correctamente.");
      } catch (err) {
        alert("Error al actualizar partido en Supabase: " + err.message);
      }
    }

    setMatches(prev => prev.map(m => m.id === matchId ? {
      ...m,
      actualScoreA: parsedA,
      actualScoreB: parsedB,
      status: status,
      teamA: teamA !== undefined ? teamA : m.teamA,
      flagA: flagA !== undefined ? flagA : m.flagA,
      teamB: teamB !== undefined ? teamB : m.teamB,
      flagB: flagB !== undefined ? flagB : m.flagB
    } : m));
  };

  // Sincronizar marcadores reales de manera automática y en segundo plano
  const syncLiveScores = async (isManual = false) => {
    try {
      const res = await fetch('https://worldcup26.ir/get/games');
      if (!res.ok) throw new Error('No se pudo conectar a la API de resultados.');
      const data = await res.json();
      if (!data || !data.games) throw new Error('Formato de respuesta de API inválido.');

      // Cargar la última foto de partidos desde Supabase para comparar con datos frescos
      let dbMatches = [];
      if (isSupabaseConnected && supabase) {
        const { data: latestDbMatches } = await supabase.from('matches').select('*').order('id', { ascending: true });
        if (latestDbMatches && latestDbMatches.length > 0) {
          dbMatches = latestDbMatches;
        }
      }
      if (dbMatches.length === 0) {
        // Fallback a los partidos cargados en memoria
        dbMatches = matches.map(m => ({
          id: m.id,
          team_a: m.teamA,
          team_b: m.teamB,
          actual_score_a: m.actualScoreA,
          actual_score_b: m.actualScoreB,
          status: m.status
        }));
      }

      let hasChanges = false;
      const dbUpdates = [];

      data.games.forEach(apiGame => {
        // Encontrar el partido correspondiente
        // Primero intentamos emparejar por nombre de equipos (traducidos al español)
        const spanishHome = apiGame.home_team_name_en ? (apiTeamNameToSpanish[apiGame.home_team_name_en] || apiGame.home_team_name_en) : '';
        const spanishAway = apiGame.away_team_name_en ? (apiTeamNameToSpanish[apiGame.away_team_name_en] || apiGame.away_team_name_en) : '';

        const dbMatch = dbMatches.find(m => {
          if (!m.team_a || !m.team_b || !spanishHome || !spanishAway) return false;
          const mHome = m.team_a.trim().toLowerCase();
          const mAway = m.team_b.trim().toLowerCase();
          const sHome = spanishHome.trim().toLowerCase();
          const sAway = spanishAway.trim().toLowerCase();

          return (mHome === sHome && mAway === sAway) || (mHome === sAway && mAway === sHome);
        });

        // Si no se encuentra por equipos (ej: fase de eliminación con placeholders como "Ganador Match 74"),
        // intentamos mapear por ID si el partido no es de fase de grupos en el API
        const finalMatchMatch = dbMatch || (apiGame.type !== 'group' ? dbMatches.find(m => m.id === parseInt(apiGame.id)) : null);

        if (finalMatchMatch) {
          const apiScoreA = apiGame.home_score !== null && apiGame.home_score !== 'null' && apiGame.home_score !== undefined ? parseInt(apiGame.home_score) : null;
          const apiScoreB = apiGame.away_score !== null && apiGame.away_score !== 'null' && apiGame.away_score !== undefined ? parseInt(apiGame.away_score) : null;
          const apiStatus = apiGame.finished === "TRUE" ? "played" : (apiGame.time_elapsed !== "notstarted" ? "live" : "scheduled");

          if (finalMatchMatch.actual_score_a !== apiScoreA || finalMatchMatch.actual_score_b !== apiScoreB || finalMatchMatch.status !== apiStatus) {
            hasChanges = true;
            dbUpdates.push({
              id: finalMatchMatch.id,
              actual_score_a: apiScoreA,
              actual_score_b: apiScoreB,
              status: apiStatus
            });
          }
        }
      });

      if (hasChanges && isSupabaseConnected && supabase) {
        for (const update of dbUpdates) {
          await supabase.from('matches').update({
            actual_score_a: update.actual_score_a,
            actual_score_b: update.actual_score_b,
            status: update.status
          }).eq('id', update.id);
        }
        
        // Refrescar UI cargando los datos frescos
        fetchInitialData();
      }

      if (isManual) {
        alert('¡Resultados sincronizados de forma automática con éxito!');
      }
    } catch (err) {
      console.warn("Fallo la sincronización en segundo plano:", err);
      if (isManual) {
        alert('Error en la sincronización: ' + err.message);
      }
    }
  };

  const handleSyncScores = async () => {
    await syncLiveScores(true);
  };

  // Filtrado y paginación de partidos
  const filteredMatches = matches.filter(m => selectedGroupFilter === 'Todos' || m.group === selectedGroupFilter);
  const currentMatch = filteredMatches[currentMatchIndex] || null;

  // Obtener pronóstico del usuario actual para el partido activo con fallback a username o ID
  const currentUserPrediction = (currentUser && currentTenant && currentMatch)
    ? (predictions[`${currentTenant.id}_${currentUser.id}`]?.[currentMatch.id] || 
       predictions[`${currentTenant.id}_${(currentUser.username || '').trim()}`]?.[currentMatch.id] || 
       null)
    : null;

  const handleNextMatch = () => {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    if (currentMatchIndex < filteredMatches.length - 1) {
      setCurrentMatchIndex(currentMatchIndex + 1);
    }
  };

  const handlePrevMatch = () => {
    if (document.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
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
      
      {/* CAPA: Bandera de Argentina */}
      <div className="argentina-flag-bg">
        <div className="argentina-sun-overlay"></div>
      </div>

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
          <div className="glass-card onboarding-card text-center" style={{ borderLeft: '4px solid var(--accent-color)', animation: 'float 0.5s ease-out', maxWidth: '480px', width: '90%', padding: '2rem' }}>
            <span style={{ fontSize: '3.5rem' }}>⚽❤️</span>
            <h2 style={{ marginTop: '1rem', color: 'var(--accent-color)', fontSize: '1.75rem', fontWeight: 'bold' }}>¡BIENVENIDO, PATADURA!</h2>
            <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.5rem' }}>
              Te registraste en: {currentTenant?.name}
            </h4>
            <p style={{ color: 'var(--text-primary)', margin: '1.5rem 0', fontSize: '1.25rem', lineHeight: '1.6', fontWeight: 600, fontStyle: 'italic', textAlign: 'center' }}>
              "{welcomePopupMessage}"
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
              <button 
                className="btn-primary" 
                onClick={() => setShowWelcomePopup(false)}
                style={{ 
                  flex: '1 1 180px',
                  padding: '0.75rem 1.5rem', 
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Seguí, Cebollita!
              </button>
              <button 
                className="btn-secondary" 
                disabled
                style={{ 
                  flex: '1 1 180px',
                  padding: '0.75rem 1.5rem', 
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'not-allowed',
                  opacity: 0.5
                }}
              >
                Modo Dios (Messi) 🐐
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BANTER POPUP (Chicana de 3 segundos) */}
      {showBanterPopup && (
        <div className="onboarding-wrapper" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="glass-card onboarding-card text-center" style={{ borderLeft: '4px solid #ffb703', animation: 'float 0.5s ease-out' }}>
            <span style={{ fontSize: '3.5rem' }}>😜</span>
            <h2 style={{ marginTop: '1rem', color: '#ffb703' }}>¡ATENCIÓN PERDEDOR!</h2>
            <p style={{ color: 'var(--text-primary)', margin: '1.5rem 0', fontSize: '1.15rem', lineHeight: '1.6', fontWeight: 600, whiteSpace: 'pre-wrap' }}>
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
            <p style={{ color: 'var(--text-primary)', margin: '1.5rem 0', fontSize: '1.35rem', lineHeight: '1.6', fontWeight: 700, whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
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
        <div 
          className="logo-container" 
          onClick={() => {
            if (currentUser && currentTenant) {
              setActiveTab('predictions');
            }
          }}
          style={{ cursor: (currentUser && currentTenant) ? 'pointer' : 'default' }}
        >
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
                    setEditPatternInput(currentUser.pattern || 'diagonal');
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

      {/* Aviso global de Duelo Pendiente */}
      {currentUser && currentTenant && (() => {
        const pendingCount = duels.filter(d => d.opponent_username === currentUser.username && d.status === 'pending').length;
        if (pendingCount === 0) return null;
        return (
          <div 
            onClick={() => setActiveTab('duels')}
            style={{ 
              background: 'linear-gradient(90deg, #ff4d4d, #f1a80a)', 
              color: '#fff', 
              textAlign: 'center', 
              padding: '0.65rem 1rem', 
              fontSize: '0.85rem', 
              fontWeight: 'bold', 
              cursor: 'pointer', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '0.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <span>⚔️ ¡Tienes {pendingCount} {pendingCount === 1 ? 'desafío' : 'desafíos'} de Piedra, Papel o Tijera pendiente! Haz clic aquí para jugar.</span>
          </div>
        );
      })()}

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
                  <div className="form-group" style={{ marginTop: '0.75rem' }}>
                    <label>Patrón de Fondo</label>
                    <select 
                      className="form-control"
                      value={editPatternInput}
                      onChange={(e) => setEditPatternInput(e.target.value)}
                      style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: '#fff', height: '38px' }}
                    >
                      <option value="diagonal">Líneas Diagonales</option>
                      <option value="horizontal">Líneas Horizontales</option>
                      <option value="vertical">Líneas Verticales</option>
                      <option value="checkers">Tablero de Ajedrez</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Copias de seguridad de pronósticos */}
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.25rem', textAlign: 'left' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--accent-color)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  💾 Copia de Seguridad de Pronósticos
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Guarda tus pronósticos en un archivo JSON o restáuralos en caso de que lo necesites.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button 
                    type="button"
                    className="btn-secondary" 
                    onClick={handleExportUserBackup} 
                    style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.75rem', flex: '1 1 auto', justifyContent: 'center' }}
                  >
                    📥 Exportar Backup (.JSON)
                  </button>
                  <label 
                    className="btn-secondary" 
                    style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.75rem', flex: '1 1 auto', textAlign: 'center', cursor: 'pointer', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    📤 Importar Backup
                    <input 
                      type="file" 
                      accept=".json" 
                      onChange={handleImportUserBackup} 
                      style={{ display: 'none' }} 
                    />
                  </label>
                </div>
              </div>

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

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label style={{ fontSize: '1.25rem', color: 'var(--accent-color)', fontWeight: 'bold', display: 'block', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05rem', textAlign: 'center' }}>
                  🔥 Selecciona tu Grupo 🔥
                </label>
                <select
                  className="form-control"
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                  style={{ 
                    fontSize: '1.1rem', 
                    padding: '0.75rem', 
                    background: 'var(--form-bg)', 
                    color: 'var(--input-color)', 
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    width: '100%',
                    cursor: 'pointer'
                  }}
                >
                  {tenants.map(t => {
                    let displayName = t.name.toUpperCase().trim();
                    if (displayName.endsWith('2026') && !displayName.endsWith(' 2026')) {
                      displayName = displayName.slice(0, -4) + ' 2026';
                    }
                    if (t.id === 'caseros2026' || displayName.includes('CASEROS')) {
                      displayName = displayName + ' ⚽❤️';
                    }
                    return (
                      <option key={t.id} value={t.id}>
                        🏆 {displayName}
                      </option>
                    );
                  })}
                </select>

                <button
                  type="button"
                  className="btn-primary"
                  style={{ 
                    marginTop: '1.25rem',
                    padding: '1.1rem 1.4rem', 
                    background: 'linear-gradient(135deg, var(--accent-color), #00ff87)', 
                    color: '#000', 
                    fontWeight: 'bold', 
                    fontSize: '1.1rem',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(0, 255, 135, 0.2)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                    width: '100%'
                  }}
                  onClick={() => {
                    const found = tenants.find(t => t.id === selectedTenantId);
                    if (found) {
                      setCurrentTenant(found);
                    } else if (tenants.length > 0) {
                      // fallback al primero si por alguna razon caseros2026 no existe todavia
                      const caserosOpt = tenants.find(t => t.id === 'caseros2026');
                      setCurrentTenant(caserosOpt || tenants[0]);
                    }
                  }}
                >
                  Entrar al Prode &rarr;
                </button>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1.5rem 0' }} />

              <form onSubmit={handleCreateTenant} style={{ opacity: 0.85 }}>
                <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                  <label htmlFor="tenantName" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05rem', textAlign: 'center', display: 'block' }}>
                    Crear un Nuevo Grupo
                  </label>
                  <input
                    type="text"
                    id="tenantName"
                    className="form-control"
                    placeholder="Ej. Compañeros de Fútbol"
                    value={newTenantName}
                    onChange={(e) => setNewTenantName(e.target.value)}
                    style={{ height: '36px', fontSize: '0.85rem', maxWidth: '300px', margin: '0 auto' }}
                    required
                  />
                </div>
                <button type="submit" className="btn-secondary" style={{ width: 'auto', padding: '0.35rem 1rem', fontSize: '0.8rem', margin: '0 auto', display: 'block' }}>
                  Crear Grupo
                </button>
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
              <form onSubmit={handleLoginUser} style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Entrar al Juego</h3>
                <div className="form-group">
                  <label>Nro. de WhatsApp (Últimos 8 números)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. 34567823 (sin el 11!)"
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                  <button type="submit" className="btn-primary" style={{ background: 'var(--accent-color)', color: '#000', fontWeight: 'bold' }}>
                    {loginBtnText}
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenRecovery}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-color)', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.85rem', alignSelf: 'center', width: 'auto', padding: '0.25rem 0.5rem' }}
                  >
                    ¿Olvidaste tu PIN?
                  </button>
                </div>
              </form>

              <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1.5rem 0' }} />

              {/* Registro */}
              {!showRegisterForm ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowRegisterForm(true)}
                  style={{ width: '100%', fontWeight: 'bold' }}
                >
                  👤 Registrar Nuevo Usuario
                </button>
              ) : (
                <form onSubmit={handleRegisterUser}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Registrarse como Nuevo Miembro</h3>
                    <button
                      type="button"
                      onClick={() => setShowRegisterForm(false)}
                      style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      [ Ocultar ]
                    </button>
                  </div>
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
                      placeholder="Ej. Nene, ¿vo' queré' morir en este instante?"
                      value={newUserMystic}
                      onChange={(e) => setNewUserMystic(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Nro. de WhatsApp (Últimos 8 números)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. 34567823 (sin el 11!)"
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
                  <div className="form-group">
                    <label>Pregunta de Seguridad (para recuperar PIN)</label>
                    <select
                      className="form-control"
                      value={regRecoveryQuestion}
                      onChange={(e) => setRegRecoveryQuestion(e.target.value)}
                      required
                    >
                      <option value="¿En tu equipo glorioso, cuál es el número de tu camiseta?">¿En tu equipo glorioso, cuál es el número de tu camiseta?</option>
                      <option value="¿Nombre de tu primera mascota?">¿Nombre de tu primera mascota?</option>
                      <option value="¿Club de fútbol de tu infancia?">¿Club de fútbol de tu infancia?</option>
                      <option value="¿Ciudad donde naciste?">¿Ciudad donde naciste?</option>
                      <option value="¿Nombre de tu escuela primaria?">¿Nombre de tu escuela primaria?</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Respuesta de Seguridad</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Escribe tu respuesta de seguridad"
                      value={regRecoveryAnswer}
                      onChange={(e) => setRegRecoveryAnswer(e.target.value)}
                      required
                    />
                  </div>
                  {participants.length === 0 && (
                    <div className="form-group" style={{ flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        id="adminCheck"
                        checked={isAdminRegister}
                        onChange={(e) => setIsAdminRegister(e.target.checked)}
                      />
                      <label htmlFor="adminCheck" style={{ textTransform: 'none', cursor: 'pointer' }}>Ser Administrador</label>
                    </div>
                  )}
                  <button type="submit" className="btn-primary" style={{ background: 'var(--accent-color)', color: '#000', fontWeight: 'bold' }}>Registrarse y Jugar</button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Paso 3: Interfaz Logueada */}
        {currentTenant && currentUser && (
          <div>
            {/* Diario y humor del Top 3 */}
            {dailyMessages && (
              <div className="glass-card mb-4 animate-fade-in" style={{ borderLeft: '4px solid var(--primary-gold)', background: 'var(--glass-bg)', boxShadow: '0 0 15px var(--primary-gold-glow)' }}>
                <h3 style={{ color: 'var(--primary-gold)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📢 El Diario del Prode - Ganadores del Día
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                  <p style={{ fontStyle: 'italic', color: 'var(--text-primary)' }}>{dailyMessages.first}</p>
                  <p style={{ fontStyle: 'italic', color: 'var(--text-primary)' }}>{dailyMessages.second}</p>
                  <p style={{ fontStyle: 'italic', color: '#e53e3e', fontWeight: 500 }}>{dailyMessages.third}</p>
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
                      {Array.from(new Set(matches.map(m => m.group)))
                        .filter(Boolean)
                        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
                        .map(groupName => (
                          <option key={groupName} value={groupName}>{groupName}</option>
                        ))
                      }
                    </select>
                  </div>
                </div>

                {currentMatch ? (
                  <div className="glass-card text-center" style={{ maxWidth: '550px', margin: '0 auto', padding: '2rem 1.5rem' }}>
                    <div className="match-header" style={{ justifyContent: 'center', gap: '1rem', alignItems: 'center' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        background: (currentMatch.stage === 2 || currentMatch.id >= 73) ? 'gold' : 'rgba(255,255,255,0.1)', 
                        color: (currentMatch.stage === 2 || currentMatch.id >= 73) ? '#000' : '#fff', 
                        padding: '0.15rem 0.4rem', 
                        borderRadius: '4px', 
                        fontWeight: 'bold'
                      }}>
                        {(currentMatch.stage === 2 || currentMatch.id >= 73) ? 'Fase Final' : 'Fase de Grupos'}
                      </span>
                      <strong>{currentMatch.group}</strong> • <span>{currentMatch.date}</span>
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>{currentMatch.stadium}</p>

                    {(currentMatch.status === 'played' || currentMatch.status === 'live') && (
                      <div style={{ color: currentMatch.status === 'played' ? '#ff4d4d' : '#00ff87', fontWeight: '700', fontSize: '0.9rem', marginBottom: '1rem', background: currentMatch.status === 'played' ? 'rgba(255, 77, 77, 0.1)' : 'rgba(0, 255, 135, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>
                        {currentMatch.status === 'played' ? '🔒 Partido finalizado. Pronósticos cerrados.' : '⚡ Partido en vivo. Pronósticos cerrados.'}
                      </div>
                    )}

                    {currentMatch.status !== 'played' && currentMatch.status !== 'live' && isMatchPredictionsClosed(currentMatch) && (
                      <div style={{ color: '#ffb703', fontWeight: '700', fontSize: '0.9rem', marginBottom: '1rem', background: 'rgba(255, 183, 3, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>
                        🔒 Pronósticos cerrados por fecha límite ({getMatchDeadlineString(currentMatch)}).
                      </div>
                    )}

                    <div className="match-body" style={{ flexDirection: 'column', gap: '1.5rem' }}>
                      <div className="d-flex prediction-card-body" style={{ width: '100%', justifyContent: 'space-around', alignItems: 'center' }}>
                        
                        {/* Team A */}
                        <div className="team-container" style={{ flex: 1, minWidth: 0 }}>
                          <span className="team-flag" style={{ fontSize: '3.5rem' }}>{currentMatch.flagA}</span>
                          <span className="team-name" style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>{currentMatch.teamA}</span>
                        </div>

                        {/* Inputs Grandes */}
                        <div className="prediction-inputs" style={{ gap: '1rem' }}>
                          <input
                             type="text"
                             inputMode="numeric"
                             pattern="[0-9]*"
                             className="score-input"
                             style={{ width: '70px', height: '70px', fontSize: '2rem', textAlign: 'center' }}
                             value={currentUserPrediction?.scoreA ?? ''}
                             onFocus={(e) => e.target.select()}
                             onChange={(e) => {
                               const val = e.target.value.replace(/\D/g, '');
                               handlePredictionChange(currentMatch.id, 'scoreA', val);
                             }}
                             disabled={currentMatch.status === 'played' || currentMatch.status === 'live' || isMatchPredictionsClosed(currentMatch)}
                           />
                           <span className="score-separator" style={{ fontSize: '2rem' }}>-</span>
                           <input
                             type="text"
                             inputMode="numeric"
                             pattern="[0-9]*"
                             className="score-input"
                             style={{ width: '70px', height: '70px', fontSize: '2rem', textAlign: 'center' }}
                             value={currentUserPrediction?.scoreB ?? ''}
                             onFocus={(e) => e.target.select()}
                             onChange={(e) => {
                               const val = e.target.value.replace(/\D/g, '');
                               handlePredictionChange(currentMatch.id, 'scoreB', val);
                             }}
                             disabled={currentMatch.status === 'played' || currentMatch.status === 'live' || isMatchPredictionsClosed(currentMatch)}
                           />
                        </div>

                        {/* Team B */}
                        <div className="team-container" style={{ flex: 1, minWidth: 0 }}>
                          <span className="team-flag" style={{ fontSize: '3.5rem' }}>{currentMatch.flagB}</span>
                          <span className="team-name" style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>{currentMatch.teamB}</span>
                        </div>

                      </div>

                      {/* Selector de ganador por penales en caso de empate en Fase 2 (Knockouts) */}
                      {(currentMatch.stage === 2 || currentMatch.id >= 73) && 
                       currentUserPrediction && 
                       currentUserPrediction.scoreA !== '' && 
                       currentUserPrediction.scoreB !== '' && 
                       currentUserPrediction.scoreA !== null && 
                       currentUserPrediction.scoreB !== null && 
                       currentUserPrediction.scoreA !== undefined && 
                       currentUserPrediction.scoreB !== undefined && 
                       parseInt(currentUserPrediction.scoreA) === parseInt(currentUserPrediction.scoreB) && (
                        <div className="animate-fade-in" style={{
                          marginTop: '1.5rem',
                          background: 'rgba(255, 215, 0, 0.04)',
                          border: '1px dashed rgba(255, 215, 0, 0.3)',
                          padding: '1rem',
                          borderRadius: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.75rem'
                        }}>
                          <span style={{ fontSize: '0.85rem', color: '#ffd700', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            ⚖️ Definición por Penales
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Para avanzar a la siguiente fase, selecciona el equipo que ganará la definición:
                          </span>
                          <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'center', marginTop: '0.25rem' }}>
                            <button
                              type="button"
                              onClick={() => {
                                if (currentMatch.status !== 'played' && currentMatch.status !== 'live' && !isMatchPredictionsClosed(currentMatch)) {
                                  handlePredictionChange(currentMatch.id, 'penalWinner', 'A');
                                }
                              }}
                              disabled={currentMatch.status === 'played' || currentMatch.status === 'live' || isMatchPredictionsClosed(currentMatch)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                padding: '0.6rem 1.2rem',
                                borderRadius: '8px',
                                border: currentUserPrediction?.penalWinner === 'A' ? '2.5px solid #00b359' : '1px solid rgba(0, 0, 0, 0.25)',
                                background: currentUserPrediction?.penalWinner === 'A' ? 'rgba(0, 255, 135, 0.25)' : 'rgba(0,0,0,0.05)',
                                color: '#111111',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: currentUserPrediction?.penalWinner === 'A' ? '0 0 8px rgba(0, 255, 135, 0.4)' : 'none'
                              }}
                            >
                              <span style={{ fontSize: '1.2rem' }}>{currentMatch.flagA}</span>
                              <span>{currentMatch.teamA}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (currentMatch.status !== 'played' && currentMatch.status !== 'live' && !isMatchPredictionsClosed(currentMatch)) {
                                  handlePredictionChange(currentMatch.id, 'penalWinner', 'B');
                                }
                              }}
                              disabled={currentMatch.status === 'played' || currentMatch.status === 'live' || isMatchPredictionsClosed(currentMatch)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                padding: '0.6rem 1.2rem',
                                borderRadius: '8px',
                                border: currentUserPrediction?.penalWinner === 'B' ? '2px solid #00b359' : '1px solid rgba(0, 0, 0, 0.25)',
                                background: currentUserPrediction?.penalWinner === 'B' ? 'rgba(0, 255, 135, 0.25)' : 'rgba(0,0,0,0.05)',
                                color: '#111111',
                                fontSize: '1rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: currentUserPrediction?.penalWinner === 'B' ? '0 0 8px rgba(0, 255, 135, 0.4)' : 'none'
                              }}
                            >
                              <span style={{ fontSize: '1.2rem' }}>{currentMatch.flagB}</span>
                              <span>{currentMatch.teamB}</span>
                            </button>
                          </div>
                          {(!currentUserPrediction?.penalWinner) && (
                            <span style={{ fontSize: '0.75rem', color: '#ff4d4d', fontWeight: 'bold', marginTop: '0.25rem' }}>
                              ⚠️ Debes seleccionar un ganador para completar tu pronóstico.
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', width: '100%' }}>
                      {(currentMatch.status === 'played' || currentMatch.status === 'live') ? (
                        (() => {
                          const pts = calculatePoints(currentUserPrediction, currentMatch);
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {currentMatch.status === 'live' ? 'Resultado en Vivo:' : 'Resultado Oficial:'}
                                  </span>
                                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                                    {currentMatch.actualScoreA} - {currentMatch.actualScoreB}
                                  </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tu Puntuación:</span>
                                  <div style={{ 
                                    background: badgeBg, 
                                    color: badgeColor, 
                                    padding: '0.25rem 0.75rem', 
                                    borderRadius: '8px', 
                                    fontSize: '1.1rem', 
                                    fontWeight: 'bold',
                                    border: `1px solid ${badgeColor}44`,
                                    display: 'inline-block'
                                  }}>
                                    +{pts} {pts === 1 ? 'punto' : 'puntos'}
                                  </div>
                                </div>
                              </div>
                              <div style={{ 
                                background: 'var(--bg-secondary)', 
                                padding: '0.75rem 1rem', 
                                borderRadius: '8px', 
                                borderLeft: `4px solid ${badgeColor}`,
                                fontStyle: 'italic',
                                fontSize: '0.95rem',
                                color: 'var(--text-primary)',
                                marginTop: '0.5rem',
                                textAlign: 'left',
                                borderTop: '1px solid var(--glass-border)',
                                borderRight: '1px solid var(--glass-border)',
                                borderBottom: '1px solid var(--glass-border)'
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
                        onClick={() => {
                          if (currentMatchIndex === filteredMatches.length - 1) {
                            setCurrentMatchIndex(0);
                          } else {
                            handleNextMatch();
                          }
                        }}
                      >
                        {currentMatchIndex === filteredMatches.length - 1 ? 'Finalizar ✓' : 'Siguiente \u2192'}
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
                {/* Lógica para ordenar las tablas según hasPhase2MatchesPlayed */}
                {!hasPhase2MatchesPlayed ? (
                  <>
                    {/* TABLA DE FASE 1 (Predeterminada arriba al inicio) */}
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🏆 Tabla Fase de Grupos
                      <span style={{ fontSize: '0.8rem', background: '#00ff87', color: '#000', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>Fase 1</span>
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                      Standings finales e inalterables de la Fase de Grupos.
                    </p>

                    {/* Destacados Fase Inicial (Top 3) */}
                    {leaderboardPhase1.length > 0 && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '1rem',
                        marginBottom: '2rem',
                        background: 'rgba(255,255,255,0.03)',
                        padding: '1.25rem',
                        borderRadius: '12px',
                        border: '1px solid var(--glass-border)'
                      }}>
                        {/* Campeón */}
                        <div style={{
                          textAlign: 'center',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.03))',
                          border: '1px solid rgba(255, 215, 0, 0.3)',
                          boxShadow: '0 4px 12px rgba(255, 215, 0, 0.08)'
                        }}>
                          <div style={{ fontSize: '1.5rem' }}>👑</div>
                          <div style={{ fontSize: '0.75rem', color: '#ffd700', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginTop: '0.25rem' }}>Campeón Fase 1</div>
                          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-primary)', marginTop: '0.25rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{leaderboardPhase1[0]?.username}</div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.1rem', fontWeight: 'bold' }}>{leaderboardPhase1[0]?.points} pts</div>
                        </div>

                        {/* Subcampeón */}
                        {leaderboardPhase1.length > 1 && (
                          <div style={{
                            textAlign: 'center',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.12), rgba(192, 192, 192, 0.02))',
                            border: '1px solid rgba(192, 192, 192, 0.25)'
                          }}>
                            <div style={{ fontSize: '1.3rem' }}>🥈</div>
                            <div style={{ fontSize: '0.75rem', color: '#c0c0c0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginTop: '0.25rem' }}>2º Puesto</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.25rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{leaderboardPhase1[1]?.username}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.1rem', fontWeight: '600' }}>{leaderboardPhase1[1]?.points} pts</div>
                          </div>
                        )}

                        {/* Tercer Puesto */}
                        {leaderboardPhase1.length > 2 && (
                          <div style={{
                            textAlign: 'center',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, rgba(205, 127, 50, 0.1), rgba(205, 127, 50, 0.02))',
                            border: '1px solid rgba(205, 127, 50, 0.2)'
                          }}>
                            <div style={{ fontSize: '1.2rem' }}>🥉</div>
                            <div style={{ fontSize: '0.75rem', color: '#cd7f32', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginTop: '0.25rem' }}>3º Puesto</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.25rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{leaderboardPhase1[2]?.username}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.1rem', fontWeight: '600' }}>{leaderboardPhase1[2]?.points} pts</div>
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ overflowX: 'auto', marginBottom: '3rem' }}>
                      <table className="leaderboard-table">
                        <thead>
                          <tr>
                            <th>Pos</th>
                            <th>Apodo</th>
                            <th style={{ textAlign: 'center' }}>Exacto</th>
                            <th style={{ textAlign: 'right' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaderboardPhase1.map((row, idx) => (
                            <tr key={row.id} className="leaderboard-row">
                              <td className="rank-cell">
                                {idx === 0 ? '👑 ' : idx === 1 ? '🥈 ' : idx === 2 ? '🥉 ' : ''}{idx + 1}º
                              </td>
                              <td>
                                <span
                                  style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--accent-color)', fontWeight: 600 }}
                                  title="Haz clic para ver el perfil"
                                  onClick={() => setUserProfileModal({ username: row.username, fullName: row.fullName, mysticPhrase: row.mysticPhrase, whatsapp: row.whatsapp })}
                                >
                                  {row.username}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center' }}>{row.exactScores * 7} pts</td>
                              <td className="points-cell">{row.points} pts</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* TABLA DE FASE 2 (Abajo por ahora) */}
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
                      🏆 Tabla Fase Final
                      <span style={{ fontSize: '0.8rem', background: 'gold', color: '#000', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>Fase 2</span>
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                      Standings para la Fase de Eliminación directa (Octavos de Final, Cuartos, Semifinal y Final). Comienza en 0 pts.
                    </p>
                    <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
                      <table className="leaderboard-table">
                        <thead>
                          <tr>
                            <th>Pos</th>
                            <th>Apodo</th>
                            <th style={{ textAlign: 'center' }}>Exacto</th>
                            <th style={{ textAlign: 'right' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaderboardPhase2.map((row, idx) => (
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
                              <td style={{ textAlign: 'center' }}>{row.exactScores * 7} pts</td>
                              <td className="points-cell" style={{ color: 'gold', fontWeight: 'bold' }}>{row.points} pts</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <>
                    {/* TABLA DE FASE 2 (Arriba ya que comenzó a jugarse) */}
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🏆 Tabla Fase Final
                      <span style={{ fontSize: '0.8rem', background: 'gold', color: '#000', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>Fase 2</span>
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                      Standings para la Fase de Eliminación directa (Octavos de Final, Cuartos, Semifinal y Final). Comienza en 0 pts.
                    </p>
                    <div style={{ overflowX: 'auto', marginBottom: '3rem' }}>
                      <table className="leaderboard-table">
                        <thead>
                          <tr>
                            <th>Pos</th>
                            <th>Apodo</th>
                            <th style={{ textAlign: 'center' }}>Exacto</th>
                            <th style={{ textAlign: 'right' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaderboardPhase2.map((row, idx) => (
                            <tr key={row.id} className="leaderboard-row">
                              <td className="rank-cell">
                                {idx === 0 ? '👑 ' : idx === 1 ? '🥈 ' : idx === 2 ? '🥉 ' : ''}{idx + 1}º
                              </td>
                              <td>
                                <span
                                  style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--accent-color)', fontWeight: 600 }}
                                  title="Haz clic para ver el perfil"
                                  onClick={() => setUserProfileModal({ username: row.username, fullName: row.fullName, mysticPhrase: row.mysticPhrase, whatsapp: row.whatsapp })}
                                >
                                  {row.username}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center' }}>{row.exactScores * 7} pts</td>
                              <td className="points-cell" style={{ color: 'gold', fontWeight: 'bold' }}>{row.points} pts</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* TABLA DE FASE 1 (Abajo de consulta histórica) */}
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
                      🏆 Tabla Fase de Grupos
                      <span style={{ fontSize: '0.8rem', background: '#00ff87', color: '#000', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>Fase 1</span>
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                      Standings finales e inalterables de la Fase de Grupos.
                    </p>

                    {/* Destacados Fase Inicial (Top 3) */}
                    {leaderboardPhase1.length > 0 && (
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '1rem',
                        marginBottom: '2rem',
                        background: 'rgba(255,255,255,0.03)',
                        padding: '1.25rem',
                        borderRadius: '12px',
                        border: '1px solid var(--glass-border)'
                      }}>
                        {/* Campeón */}
                        <div style={{
                          textAlign: 'center',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.03))',
                          border: '1px solid rgba(255, 215, 0, 0.3)',
                          boxShadow: '0 4px 12px rgba(255, 215, 0, 0.08)'
                        }}>
                          <div style={{ fontSize: '1.5rem' }}>👑</div>
                          <div style={{ fontSize: '0.75rem', color: '#ffd700', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginTop: '0.25rem' }}>Campeón Fase 1</div>
                          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: 'var(--text-primary)', marginTop: '0.25rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{leaderboardPhase1[0]?.username}</div>
                          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.1rem', fontWeight: 'bold' }}>{leaderboardPhase1[0]?.points} pts</div>
                        </div>

                        {/* Subcampeón */}
                        {leaderboardPhase1.length > 1 && (
                          <div style={{
                            textAlign: 'center',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.12), rgba(192, 192, 192, 0.02))',
                            border: '1px solid rgba(192, 192, 192, 0.25)'
                          }}>
                            <div style={{ fontSize: '1.3rem' }}>🥈</div>
                            <div style={{ fontSize: '0.75rem', color: '#c0c0c0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginTop: '0.25rem' }}>2º Puesto</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.25rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{leaderboardPhase1[1]?.username}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.1rem', fontWeight: '600' }}>{leaderboardPhase1[1]?.points} pts</div>
                          </div>
                        )}

                        {/* Tercer Puesto */}
                        {leaderboardPhase1.length > 2 && (
                          <div style={{
                            textAlign: 'center',
                            padding: '0.75rem',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, rgba(205, 127, 50, 0.1), rgba(205, 127, 50, 0.02))',
                            border: '1px solid rgba(205, 127, 50, 0.2)'
                          }}>
                            <div style={{ fontSize: '1.2rem' }}>🥉</div>
                            <div style={{ fontSize: '0.75rem', color: '#cd7f32', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginTop: '0.25rem' }}>3º Puesto</div>
                            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.25rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{leaderboardPhase1[2]?.username}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.1rem', fontWeight: '600' }}>{leaderboardPhase1[2]?.points} pts</div>
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
                      <table className="leaderboard-table">
                        <thead>
                          <tr>
                            <th>Pos</th>
                            <th>Apodo</th>
                            <th style={{ textAlign: 'center' }}>Exacto</th>
                            <th style={{ textAlign: 'right' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaderboardPhase1.map((row, idx) => (
                            <tr key={row.id} className="leaderboard-row">
                              <td className="rank-cell">
                                {idx === 0 ? '👑 ' : idx === 1 ? '🥈 ' : idx === 2 ? '🥉 ' : ''}{idx + 1}º
                              </td>
                              <td>
                                <span
                                  style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--accent-color)', fontWeight: 600 }}
                                  title="Haz clic para ver el perfil"
                                  onClick={() => setUserProfileModal({ username: row.username, fullName: row.fullName, mysticPhrase: row.mysticPhrase, whatsapp: row.whatsapp })}
                                >
                                  {row.username}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center' }}>{row.exactScores * 7} pts</td>
                              <td className="points-cell">{row.points} pts</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {/* Cartel de Advertencia de Poderes */}
                <div style={{ background: 'rgba(255, 77, 77, 0.05)', border: '1px solid rgba(255, 77, 77, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.4', marginTop: '2rem' }}>
                  📢 <strong>Regla del Campeón</strong>: El líder absoluto (Puesto #1 de la fase activa) tiene el poder de castigar visualmente a los "Losers" (mitad inferior de la tabla) personalizando sus colores de fondo a rayas continuas y estampando su Frase Mística de forma permanente en sus pantallas. ¡Haz clic en tu apodo arriba para personalizar!
                </div>

                {/* Sección de Desglose de Puntos por Partido Jugado */}
                {(() => {
                  const playedMatches = matches.filter(m => m.status === 'played' || m.status === 'live');
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
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                          {selectedMatch.group} • {selectedMatch.status === 'live' ? 'Marcador en Vivo' : 'Marcador Oficial'}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginTop: '0.5rem' }}>
                          <span style={{ fontSize: '1.1rem' }}>{selectedMatch.flagA} <strong>{selectedMatch.teamA}</strong></span>
                          <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-color)', padding: '0.2rem 0.5rem', background: 'rgba(0, 255, 135, 0.05)', borderRadius: '6px', whiteSpace: 'nowrap' }}>
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
                                  ? { background: 'var(--points-partial-bg)', color: 'var(--points-partial)', border: '1px solid var(--points-partial)' }
                                  : { background: 'var(--points-zero-bg)', color: 'var(--text-secondary)', border: '1px solid var(--points-zero-border)' };

                              return (
                                <tr key={row.id} className="leaderboard-row" style={{ background: isCurrentUser ? 'rgba(0, 255, 135, 0.04)' : 'transparent' }}>
                                  <td className="rank-cell" style={{ fontWeight: isCurrentUser ? 'bold' : 'normal' }}>{idx + 1}º</td>
                                  <td>
                                    <span style={{ fontWeight: isCurrentUser ? 'bold' : 'normal', color: isCurrentUser ? 'var(--accent-color)' : 'var(--text-primary)' }}>
                                      {row.username} {isCurrentUser && ' (Tú)'}
                                    </span>
                                  </td>
                                  <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                    {row.pred ? (
                                      <span style={{ color: 'var(--text-primary)' }}>{row.pred.scoreA} - {row.pred.scoreB}</span>
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
                        const isPlayed = m.status === 'played' || m.status === 'live';
                         const pts = isPlayed ? calculatePoints(pred, m) : 0;

                        return (
                          <div key={m.id} className="glass-card" style={{ padding: '1rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{m.group}</div>
                            <div className="d-flex" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ flex: 1, textAlign: 'left' }}>{m.flagA} {m.teamA}</span>
                              <strong style={{ fontSize: '1.2rem', minWidth: '80px', textAlign: 'center', padding: '0 0.5rem' }}>
                                {pred ? `${pred.scoreA} - ${pred.scoreB}` : '-'}
                              </strong>
                              <span style={{ flex: 1, textAlign: 'right' }}>{m.teamB} {m.flagB}</span>
                            </div>
                            {isPlayed && (
                              <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>
                                  Resultado Real: <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginLeft: '0.25rem' }}>{m.actualScoreA} - {m.actualScoreB}</strong>
                                </span>
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
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Fuente: API worldcup26.ir</span>
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
                              <span style={{ flex: 1, textAlign: 'left' }}>
                                Pronóstico de <strong>{participants.find(p => p.id === comparisonUserId)?.username}</strong>:
                              </span>
                              <strong style={{ 
                                minWidth: '80px', 
                                textAlign: 'center', 
                                fontSize: '1.1rem', 
                                color: pred ? 'var(--text-primary)' : 'var(--text-secondary)' 
                              }}>
                                {pred ? `${pred.scoreA} - ${pred.scoreB}` : 'Sin cargar'}
                              </strong>
                              <span style={{ flex: 1, textAlign: 'right' }}></span>
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
                        {/* Formulario de actualización manual del Admin */}
                        {currentUser.isAdmin && (
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            const scoreA = e.target.elements.scoreA.value;
                            const scoreB = e.target.elements.scoreB.value;
                            const status = e.target.elements.status.value;
                            const teamA = e.target.elements.teamA?.value;
                            const flagA = e.target.elements.flagA?.value;
                            const teamB = e.target.elements.teamB?.value;
                            const flagB = e.target.elements.flagB?.value;
                            handleSaveMatchScoreManual(match.id, scoreA, scoreB, status, teamA, flagA, teamB, flagB);
                          }} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {(match.stage === 2 || match.id >= 73) && (
                              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
                                <input 
                                  type="text" 
                                  name="flagA" 
                                  placeholder="Bandera A" 
                                  defaultValue={match.flagA ?? ''} 
                                  style={{ width: '40px', padding: '0.25rem', fontSize: '0.9rem', textAlign: 'center', background: 'var(--form-bg)', border: '1px solid var(--glass-border)', color: 'var(--input-color)', borderRadius: '4px' }} 
                                />
                                <input 
                                  type="text" 
                                  name="teamA" 
                                  placeholder="Equipo A" 
                                  defaultValue={match.teamA ?? ''} 
                                  style={{ width: '90px', padding: '0.25rem', fontSize: '0.9rem', background: 'var(--form-bg)', border: '1px solid var(--glass-border)', color: 'var(--input-color)', borderRadius: '4px' }} 
                                />
                                <span>vs</span>
                                <input 
                                  type="text" 
                                  name="teamB" 
                                  placeholder="Equipo B" 
                                  defaultValue={match.teamB ?? ''} 
                                  style={{ width: '90px', padding: '0.25rem', fontSize: '0.9rem', background: 'var(--form-bg)', border: '1px solid var(--glass-border)', color: 'var(--input-color)', borderRadius: '4px' }} 
                                />
                                <input 
                                  type="text" 
                                  name="flagB" 
                                  placeholder="Bandera B" 
                                  defaultValue={match.flagB ?? ''} 
                                  style={{ width: '40px', padding: '0.25rem', fontSize: '0.9rem', textAlign: 'center', background: 'var(--form-bg)', border: '1px solid var(--glass-border)', color: 'var(--input-color)', borderRadius: '4px' }} 
                                />
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                              <input 
                                type="number" 
                                name="scoreA" 
                                placeholder="Goles A" 
                                defaultValue={match.actualScoreA ?? ''} 
                                style={{ width: '60px', padding: '0.25rem', fontSize: '0.9rem', textAlign: 'center', background: 'var(--form-bg)', border: '1px solid var(--glass-border)', color: 'var(--input-color)', borderRadius: '4px' }} 
                              />
                              <span>-</span>
                              <input 
                                type="number" 
                                name="scoreB" 
                                placeholder="Goles B" 
                                defaultValue={match.actualScoreB ?? ''} 
                                style={{ width: '60px', padding: '0.25rem', fontSize: '0.9rem', textAlign: 'center', background: 'var(--form-bg)', border: '1px solid var(--glass-border)', color: 'var(--input-color)', borderRadius: '4px' }} 
                              />
                              <select 
                                name="status" 
                                defaultValue={match.status} 
                                style={{ padding: '0.25rem', fontSize: '0.9rem', background: 'var(--form-bg)', border: '1px solid var(--glass-border)', color: 'var(--input-color)', borderRadius: '4px' }}
                              >
                                <option value="scheduled">Pendiente</option>
                                <option value="played">Finalizado</option>
                              </select>
                              <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}>
                                Guardar
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Moderación de Mensajes del Admin */}
                {currentUser.isAdmin && (
                  <div style={{ marginTop: '3rem', borderTop: '2px solid var(--glass-border)', paddingTop: '2rem' }}>
                    <h3 style={{ fontSize: '1.3rem', color: '#ffb703', marginBottom: '1.5rem', fontWeight: 'bold' }}>
                      🛡️ Panel de Moderación de Mensajes
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                      
                      {/* Chicanas */}
                      <div className="glass-card" style={{ background: 'rgba(255, 77, 77, 0.02)' }}>
                        <h4 style={{ color: '#ff4d4d', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                          🔥 Chicanas y Boludeos
                        </h4>
                        {boludeoEventsList.length === 0 ? (
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No hay chicanas enviadas.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px', overflowY: 'auto' }}>
                            {boludeoEventsList.map(ev => (
                              <div key={ev.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                  <strong>De: {ev.triggered_by_username}</strong>
                                  <span>{new Date(ev.created_at).toLocaleDateString()}</span>
                                </div>
                                <p style={{ fontSize: '0.85rem', fontStyle: 'italic', margin: '0.5rem 0', wordBreak: 'break-word' }}>
                                  "{ev.message}"
                                </p>
                                {ev.message !== "Borrado por el Admin (Se había ido al pasto...)" && (
                                  <button 
                                    className="btn-secondary" 
                                    onClick={() => handleModerateBoludeoEvent(ev.id)}
                                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: '#ff4d4d', borderColor: '#ff4d4d', background: 'none', width: 'auto', marginTop: '0.25rem' }}
                                  >
                                    ⚠️ Moderar Mensaje
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Descargos */}
                      <div className="glass-card" style={{ background: 'rgba(255, 183, 3, 0.02)' }}>
                        <h4 style={{ color: '#ffb703', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                          💬 Descargos de Duelos
                        </h4>
                        {(() => {
                          const completedWithResponse = duels.filter(d => d.status === 'completed' && d.loser_response);
                          if (completedWithResponse.length === 0) {
                            return <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No hay descargos cargados.</p>;
                          }
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '350px', overflowY: 'auto' }}>
                              {completedWithResponse.map(dl => (
                                <div key={dl.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--glass-border)' }}>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                    <strong>Ganó: {dl.winner_username}</strong>
                                    <span>{new Date(dl.created_at || Date.now()).toLocaleDateString()}</span>
                                  </div>
                                  <p style={{ fontSize: '0.85rem', fontStyle: 'italic', margin: '0.5rem 0', wordBreak: 'break-word' }}>
                                    "{dl.loser_response}"
                                  </p>
                                  {dl.loser_response !== "Borrado por el Admin (Se había ido al pasto...)" && (
                                    <button 
                                      className="btn-secondary" 
                                      onClick={() => handleModerateDuelResponse(dl.id)}
                                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: '#ffb703', borderColor: '#ffb703', background: 'none', width: 'auto', marginTop: '0.25rem' }}
                                    >
                                      ⚠️ Moderar Descargo
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>

                    </div>

                    {/* Panel de Gestión de Participantes */}
                    <div style={{ marginTop: '3rem', borderTop: '2px solid var(--glass-border)', paddingTop: '2rem' }}>
                      <h3 style={{ fontSize: '1.3rem', color: 'var(--accent-color)', marginBottom: '1.5rem', fontWeight: 'bold' }}>
                        👥 Panel de Gestión de Participantes
                      </h3>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {participants.length === 0 ? (
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No hay participantes en este grupo.</p>
                        ) : (
                          participants.map(p => (
                            <div key={p.id} className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderColor: p.is_admin ? 'var(--accent-color)' : 'var(--glass-border)' }}>
                              <div style={{ flex: '1 1 200px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{p.username}</strong>
                                  {p.is_admin && <span style={{ fontSize: '0.7rem', background: 'var(--accent-color)', color: '#000', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold' }}>ADMIN</span>}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                  WhatsApp: <strong>{p.whatsapp}</strong> | PIN: 🔑 <strong>{p.pin}</strong>
                                </div>
                                {p.mystic_phrase && (
                                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                    Frase: <span style={{ fontStyle: 'italic' }}>"{p.mystic_phrase}"</span>
                                  </div>
                                )}
                                {dbHasRecoveryColumns && p.recovery_log && Array.isArray(p.recovery_log) && p.recovery_log.length > 0 && (
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem' }}>
                                    <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>Historial de PIN revelado:</span>
                                    <ul style={{ paddingLeft: '1rem', margin: '0.25rem 0', listStyleType: 'circle' }}>
                                      {p.recovery_log.map((ts, idx) => (
                                        <li key={idx}>{new Date(ts).toLocaleString()}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', flex: '2 1 300px' }}>
                                <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '150px' }}>
                                  <input 
                                    type="text"
                                    className="form-control"
                                    placeholder="Nombre Completo"
                                    defaultValue={p.full_name || p.fullName || ''}
                                    id={`fullname-edit-${p.id}`}
                                    style={{ height: '36px', fontSize: '0.9rem', background: 'var(--form-bg)', color: 'var(--input-color)', border: '1px solid var(--glass-border)' }}
                                  />
                                </div>
                                <button 
                                  className="btn-primary" 
                                  onClick={() => {
                                    const newVal = document.getElementById(`fullname-edit-${p.id}`).value;
                                    handleUpdateParticipantAdmin(p.id, newVal);
                                  }}
                                  style={{ width: 'auto', padding: '0.4rem 0.75rem', height: '36px', fontSize: '0.85rem' }}
                                >
                                  Guardar Nombre
                                </button>
                                <button 
                                  className="btn-secondary" 
                                  onClick={() => handleResetParticipantPin(p.id, p.username)}
                                  style={{ width: 'auto', padding: '0.4rem 0.75rem', height: '36px', fontSize: '0.85rem', borderColor: 'var(--primary-gold)', color: 'var(--primary-gold)', background: 'none' }}
                                >
                                  Restablecer PIN
                                </button>
                                {!p.is_admin && (
                                  <button 
                                    className="btn-secondary" 
                                    onClick={() => handleDeleteParticipantAdmin(p.id, p.username)}
                                    style={{ width: 'auto', padding: '0.4rem 0.75rem', height: '36px', fontSize: '0.85rem', borderColor: '#ff4d4d', color: '#ff4d4d', background: 'none' }}
                                  >
                                    Eliminar 🗑️
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Copia de Seguridad Global para el Admin */}
                    <div style={{ marginTop: '3rem', borderTop: '2px solid var(--glass-border)', paddingTop: '2rem' }}>
                      <h3 style={{ fontSize: '1.3rem', color: '#00ff87', marginBottom: '1.5rem', fontWeight: 'bold' }}>
                        📦 Copia de Seguridad Global del Grupo
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                        Descarga un respaldo en un único archivo JSON con todas las predicciones registradas por todos los integrantes de este grupo. Úsalo como salvaguarda en caso de desastre.
                      </p>
                      <button 
                        className="btn-primary" 
                        onClick={handleExportGroupBackup}
                        style={{ width: 'auto', background: 'linear-gradient(135deg, #00ff87, #60efff)', color: '#000', fontWeight: 'bold' }}
                      >
                        📦 Descargar Respaldo Total del Grupo (.JSON)
                      </button>
                    </div>

                  </div>
                )}
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
                  ¡Cada duelo ganado suma <strong>+2 puntos</strong> en la Tabla de Duelos independiente de abajo!
                </p>

                {/* Sección Desafíos Pendientes por responder */}
                {(() => {
                  const pendingToMe = duels.filter(d => d.opponent_username === currentUser.username && d.status === 'pending');
                  if (pendingToMe.length === 0) return null;
                  return (
                    <div className="glass-card mb-4 animate-fade-in" style={{ borderLeft: '4px solid #ff4d4d', background: 'var(--bg-secondary)', borderTop: '1px solid var(--glass-border)', borderRight: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>
                      <h4 style={{ color: '#ff4d4d', marginBottom: '0.75rem', fontWeight: 'bold' }}>
                        🚨 Tienes {pendingToMe.length} {pendingToMe.length === 1 ? 'Desafío Pendiente' : 'Desafíos Pendientes'}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {pendingToMe.map(d => (
                          <div key={d.id} style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                              <span style={{ color: 'var(--text-primary)' }}><strong style={{ color: 'var(--accent-color)' }}>{d.challenger_username}</strong> te desafió a un duelo.</span>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(d.created_at || Date.now()).toLocaleDateString()}</span>
                            </div>
                            {d.challenger_message && (
                              <p style={{ fontStyle: 'italic', color: 'var(--primary-gold)', margin: '0.5rem 0', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                "{d.challenger_message}"
                              </p>
                            )}

                            {selectedReplyDuel?.id === d.id ? (
                              <form onSubmit={handleReplyDuel} style={{ marginTop: '1rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
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
                                  <label style={{ color: 'var(--text-secondary)' }}>CONTRACANASTA / MENSAJE ÁCIDO:</label>
                                  <input type="text" className="form-control" style={{ background: 'var(--form-bg)', color: 'var(--input-color)', border: '1px solid var(--glass-border)' }} placeholder="Ej. ¡Sos malísimo! Tomá pa que guardes..." value={replyChicana} onChange={(e) => setReplyChicana(e.target.value)} />
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

                      <button type="submit" className="btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, #ffb703, #ff4d4d)', fontWeight: 'bold', marginTop: '1.5rem' }}>
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
                              background: 'var(--bg-secondary)', 
                              padding: '0.85rem', 
                              borderRadius: '8px',
                              border: isIWinner ? '1px solid rgba(0, 255, 135, 0.2)' : isILoser ? '1px solid rgba(255, 77, 77, 0.2)' : '1px solid var(--glass-border)' 
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
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

                              <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
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
                                    background: 'var(--bg-primary)', 
                                    padding: '0.4rem 0.6rem', 
                                    borderRadius: '4px', 
                                    marginTop: '0.4rem',
                                    borderLeft: '3px solid #ff4d4d',
                                    color: 'var(--text-primary)',
                                    fontSize: '0.82rem',
                                    borderTop: '1px solid var(--glass-border)',
                                    borderRight: '1px solid var(--glass-border)',
                                    borderBottom: '1px solid var(--glass-border)'
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
                      return (
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4' }}>
                          <p>Muro de descargos de duelos finalizados. Cuando el perdedor envíe su excusa en el historial, aparecerá aquí.</p>
                          <p style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>Aún no tienes descargos enviados ni recibidos.</p>
                        </div>
                      );
                    }
                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {myMessages.map(d => {
                          const isSentByMe = (d.winner_username !== currentUser.username);
                          const recipient = isSentByMe ? d.winner_username : (d.challenger_username === currentUser.username ? d.opponent_username : d.challenger_username);
                          return (
                            <div key={d.id} style={{ 
                              background: 'var(--bg-secondary)', 
                              padding: '1rem', 
                              borderRadius: '8px', 
                              borderLeft: isSentByMe ? '4px solid #ff4d4d' : '4px solid #00ff87',
                              border: '1px solid var(--glass-border)'
                            }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{isSentByMe ? '⬆️ Enviado a: ' + recipient : '⬇️ Recibido de: ' + recipient}</span>
                                <span>{new Date(d.created_at || Date.now()).toLocaleDateString()}</span>
                              </div>
                              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)', fontStyle: 'italic', fontWeight: 500 }}>
                                "{d.loser_response}"
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                }</div>

                {/* TABLA DE POSICIONES DE DUELOS */}
                <div className="glass-card mb-4" style={{ marginTop: '2rem' }}>
                  <h3 style={{ fontSize: '1.25rem', color: 'var(--accent-color)', marginBottom: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🏆 Tabla de Posiciones de Duelos
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                    Clasificación exclusiva basada en los minijuegos de Piedra, Papel o Tijera. Se suman +2 puntos por victoria.
                  </p>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="leaderboard-table" style={{ fontSize: '0.9rem' }}>
                      <thead>
                        <tr>
                          <th>Pos</th>
                          <th>Participante</th>
                          <th style={{ textAlign: 'center' }}>Duelos Jugados</th>
                          <th style={{ textAlign: 'center' }}>Victorias</th>
                          <th style={{ textAlign: 'right' }}>Puntos acumulados</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboardDuels.map((row, idx) => {
                          const isCurrentUser = row.id === currentUser?.id;
                          return (
                            <tr key={row.id} className="leaderboard-row" style={{ background: isCurrentUser ? 'rgba(0, 255, 135, 0.04)' : 'transparent' }}>
                              <td className="rank-cell" style={{ fontWeight: isCurrentUser ? 'bold' : 'normal' }}>{idx + 1}º</td>
                              <td>
                                <span style={{ fontWeight: isCurrentUser ? 'bold' : 'normal', color: isCurrentUser ? 'var(--accent-color)' : 'var(--text-primary)' }}>
                                  {row.username} {isCurrentUser && ' (Tú)'}
                                </span>
                              </td>
                              <td style={{ textAlign: 'center' }}>{row.duelsPlayed}</td>
                              <td style={{ textAlign: 'center', color: 'var(--accent-color)', fontWeight: 'bold' }}>{row.duelsWon} ⚔️</td>
                              <td className="points-cell" style={{ textAlign: 'right' }}>{row.points} pts</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
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
              background: 'linear-gradient(135deg, #1e5c3f, #113824)', 
              border: '1px solid rgba(0, 255, 135, 0.25)',
              padding: '1.25rem',
              borderRadius: '12px',
              gap: '1rem',
              marginTop: '2rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: '1 1 250px' }}>
                  <h4 style={{ color: '#ffd700', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold' }}>
                    🔥 Test Boludeo del #1
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#ffffff', marginTop: '0.2rem', opacity: 0.95 }}>
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
                      borderColor: '#ffd700',
                      color: '#ffd700',
                      fontWeight: 'bold',
                      fontSize: '0.95rem',
                      padding: '0.6rem 1.2rem',
                      borderRadius: '8px',
                      background: 'transparent'
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
              <button className={`tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
                📊 Tabla Principal
              </button>
              <button className={`tab-btn ${activeTab === 'predictions' ? 'active' : ''}`} onClick={() => {
                if (activeTab !== 'predictions') {
                  setActiveTab('predictions');
                  setCurrentMatchIndex(getFirstUpcomingMatchIndex());
                }
              }}>
                📝 Mis Predicciones
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

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
              <button
                className="btn-secondary"
                style={{ width: 'auto', color: '#ff4d4d', borderColor: '#ff4d4d' }}
                onClick={() => setShowLogoutConfirm(true)}
              >
                Cerrar Sesión y Cambiar de Grupo
              </button>
            </div>

          </div>
        )}

      {/* Modal de confirmación de salida */}
      {showLogoutConfirm && (
        <div className="onboarding-wrapper" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="glass-card onboarding-card text-center" style={{ borderLeft: '4px solid #ff4d4d', maxWidth: '400px', width: '90%', padding: '2rem' }}>
            <span style={{ fontSize: '3rem' }}>🚪</span>
            <h3 style={{ fontSize: '1.5rem', marginTop: '1rem', color: 'var(--text-primary)' }}>¿Deseas Salir?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '1rem 0' }}>
              ¿Estás seguro de que deseas cerrar sesión y cambiar de grupo?
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button 
                className="btn-primary" 
                onClick={() => {
                  setCurrentUser(null);
                  setCurrentTenant(null);
                  setHasRedirected(false);
                  localStorage.removeItem('caseros_prode_user');
                  localStorage.removeItem('caseros_prode_tenant');
                  setShowLogoutConfirm(false);
                }}
                style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #ff4d4d, #f1a80a)', fontWeight: 'bold' }}
              >
                Sí, Salir
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => setShowLogoutConfirm(false)}
                style={{ flex: 1, padding: '0.75rem', fontWeight: 'bold' }}
              >
                No, Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Recuperación de PIN */}
      {showRecoveryModal && (
        <div className="onboarding-wrapper" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="glass-card onboarding-card" style={{ borderLeft: '4px solid var(--accent-color)', maxWidth: '450px', width: '90%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🔑 Recuperar PIN
            </h3>
            
            {recoveryError && (
              <div style={{ color: '#ff4d4d', background: 'rgba(255, 77, 77, 0.1)', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                ⚠️ {recoveryError}
              </div>
            )}

            {recoveryStep === 1 && (
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Ingresa tu número de WhatsApp para iniciar la recuperación de tu PIN.
                </p>
                <div className="form-group">
                  <label>WhatsApp (Últimos 8 números)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. 34567823"
                    value={recoveryWhatsapp}
                    onChange={(e) => setRecoveryWhatsapp(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button className="btn-primary" onClick={handleLookupWhatsapp} style={{ flex: 1 }}>
                    Siguiente
                  </button>
                  <button className="btn-secondary" onClick={() => setShowRecoveryModal(false)} style={{ flex: 1 }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {recoveryStep === 2 && recoveryUser && (
              <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Responde a tu pregunta de seguridad para revelar el PIN.
                </p>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--accent-color)' }}>Pregunta:</label>
                  <div style={{ fontSize: '1rem', color: 'var(--text-primary)', padding: '0.5rem 0', fontWeight: 'bold' }}>
                    {recoveryUser.recovery_question}
                  </div>
                </div>
                <div className="form-group">
                  <label>Tu Respuesta</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Escribe la respuesta"
                    value={recoveryAnswerInput}
                    onChange={(e) => setRecoveryAnswerInput(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button className="btn-primary" onClick={handleVerifyRecoveryAnswer} style={{ flex: 1 }}>
                    Revelar PIN
                  </button>
                  <button className="btn-secondary" onClick={() => setRecoveryStep(1)} style={{ flex: 1 }}>
                    Atrás
                  </button>
                </div>
              </div>
            )}

            {recoveryStep === 3 && (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                  ✓ Respuesta verificada con éxito.
                </p>
                <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                  Por razones de seguridad, no podemos mostrar tu PIN aquí. Comunícate con un administrador del grupo para que restablezca tu PIN.
                </p>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'left' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.25rem', marginBottom: '0.5rem' }}>
                    Administradores del grupo:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {participants.filter(p => p.is_admin).map(adm => (
                      <div key={adm.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>{adm.username}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>WhatsApp: {adm.whatsapp}</span>
                      </div>
                    ))}
                    {participants.filter(p => p.is_admin).length === 0 && (
                      <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.85rem' }}>
                        No hay administradores registrados en este grupo.
                      </div>
                    )}
                  </div>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                  ⚠️ Se ha registrado esta solicitud de verificación en el historial de tu cuenta.
                </p>
                <button className="btn-primary" onClick={() => setShowRecoveryModal(false)} style={{ width: '100%' }}>
                  Entendido
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      </main>
    </div>
  );
}

export default App;
