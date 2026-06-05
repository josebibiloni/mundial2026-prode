export const initialMatches = [
  // --- GRUPO A ---
  { id: 1, teamA: 'México', flagA: '🇲🇽', teamB: 'Sudáfrica', flagB: '🇿🇦', group: 'Grupo A', date: '11 Jun 2026 - 15:00', stadium: 'Estadio Azteca, CDMX', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 2, teamA: 'Corea del Sur', flagA: '🇰🇷', teamB: 'República Checa', flagB: '🇨🇿', group: 'Grupo A', date: '11 Jun 2026 - 18:00', stadium: 'MetLife Stadium, NY', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 3, teamA: 'México', flagA: '🇲🇽', teamB: 'Corea del Sur', flagB: '🇰🇷', group: 'Grupo A', date: '15 Jun 2026 - 15:00', stadium: 'Mercedes-Benz Stadium, Atlanta', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 4, teamA: 'República Checa', flagA: '🇨🇿', teamB: 'Sudáfrica', flagB: '🇿🇦', group: 'Grupo A', date: '15 Jun 2026 - 19:00', stadium: 'Gillette Stadium, Boston', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 5, teamA: 'República Checa', flagA: '🇨🇿', teamB: 'México', flagB: '🇲🇽', group: 'Grupo A', date: '20 Jun 2026 - 16:00', stadium: 'NRG Stadium, Houston', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 6, teamA: 'Sudáfrica', flagA: '🇿🇦', teamB: 'Corea del Sur', flagB: '🇰🇷', group: 'Grupo A', date: '20 Jun 2026 - 20:00', stadium: 'SoFi Stadium, LA', actualScoreA: null, actualScoreB: null, status: 'scheduled' },

  // --- GRUPO B ---
  { id: 7, teamA: 'Canadá', flagA: '🇨🇦', teamB: 'Bosnia y Herzegovina', flagB: '🇧🇦', group: 'Grupo B', date: '12 Jun 2026 - 21:00', stadium: 'BMO Field, Toronto', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 8, teamA: 'Qatar', flagA: '🇶🇦', teamB: 'Suiza', flagB: '🇨🇭', group: 'Grupo B', date: '12 Jun 2026 - 15:00', stadium: 'BC Place, Vancouver', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 9, teamA: 'Canadá', flagA: '🇨🇦', teamB: 'Qatar', flagB: '🇶🇦', group: 'Grupo B', date: '16 Jun 2026 - 18:00', stadium: 'Lumen Field, Seattle', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 10, teamA: 'Suiza', flagA: '🇨🇭', teamB: 'Bosnia y Herzegovina', flagB: '🇧🇦', group: 'Grupo B', date: '16 Jun 2026 - 21:00', stadium: 'Levi\'s Stadium, SF', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 11, teamA: 'Suiza', flagA: '🇨🇭', teamB: 'Canadá', flagB: '🇨🇦', group: 'Grupo B', date: '21 Jun 2026 - 15:00', stadium: 'Lincoln Financial Field, Philly', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 12, teamA: 'Bosnia y Herzegovina', flagA: '🇧🇦', teamB: 'Qatar', flagB: '🇶🇦', group: 'Grupo B', date: '21 Jun 2026 - 19:00', stadium: 'Hard Rock Stadium, Miami', actualScoreA: null, actualScoreB: null, status: 'scheduled' },

  // --- GRUPO C ---
  { id: 13, teamA: 'Brasil', flagA: '🇧🇷', teamB: 'Marruecos', flagB: '🇲🇦', group: 'Grupo C', date: '13 Jun 2026 - 14:00', stadium: 'MetLife Stadium, New Jersey', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 14, teamA: 'Haití', flagA: '🇭🇹', teamB: 'Escocia', flagB: '🏴\u200b󠁧\u200b󠁢\u200b󠁳\u200b󠁣\u200b󠁴\u200b󠁿', group: 'Grupo C', date: '13 Jun 2026 - 18:00', stadium: 'AT&T Stadium, Dallas', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 15, teamA: 'Brasil', flagA: '🇧🇷', teamB: 'Haití', flagB: '🇭🇹', group: 'Grupo C', date: '17 Jun 2026 - 15:00', stadium: 'Arrowhead Stadium, KC', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 16, teamA: 'Escocia', flagA: '🏴\u200b󠁧\u200b󠁢\u200b󠁳\u200b󠁣\u200b󠁴\u200b󠁿', teamB: 'Marruecos', flagB: '🇲🇦', group: 'Grupo C', date: '17 Jun 2026 - 19:00', stadium: 'Mercedes-Benz Stadium, Atlanta', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 17, teamA: 'Escocia', flagA: '🏴\u200b󠁧\u200b󠁢\u200b󠁳\u200b󠁣\u200b󠁴\u200b󠁿', teamB: 'Brasil', flagB: '🇧🇷', group: 'Grupo C', date: '22 Jun 2026 - 16:00', stadium: 'Lincoln Financial Field, Philly', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 18, teamA: 'Marruecos', flagA: '🇲🇦', teamB: 'Haití', flagB: '🇭🇹', group: 'Grupo C', date: '22 Jun 2026 - 20:00', stadium: 'Gillette Stadium, Boston', actualScoreA: null, actualScoreB: null, status: 'scheduled' },

  // --- GRUPO D ---
  { id: 19, teamA: 'Estados Unidos', flagA: '🇺🇸', teamB: 'Paraguay', flagB: '🇵🇾', group: 'Grupo D', date: '13 Jun 2026 - 17:00', stadium: 'Hard Rock Stadium, Miami', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 20, teamA: 'Australia', flagA: '🇦🇺', teamB: 'Turquía', flagB: '🇹🇷', group: 'Grupo D', date: '13 Jun 2026 - 21:00', stadium: 'NRG Stadium, Houston', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 21, teamA: 'Estados Unidos', flagA: '🇺🇸', teamB: 'Australia', flagB: '🇦🇺', group: 'Grupo D', date: '17 Jun 2026 - 16:00', stadium: 'SoFi Stadium, LA', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 22, teamA: 'Turquía', flagA: '🇹🇷', teamB: 'Paraguay', flagB: '🇵🇾', group: 'Grupo D', date: '17 Jun 2026 - 20:00', stadium: 'BC Place, Vancouver', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 23, teamA: 'Turquía', flagA: '🇹🇷', teamB: 'Estados Unidos', flagB: '🇺🇸', group: 'Grupo D', date: '22 Jun 2026 - 15:00', stadium: 'Arrowhead Stadium, KC', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 24, teamA: 'Paraguay', flagA: '🇵🇾', teamB: 'Australia', flagB: '🇦🇺', group: 'Grupo D', date: '22 Jun 2026 - 19:00', stadium: 'MetLife Stadium, NY', actualScoreA: null, actualScoreB: null, status: 'scheduled' },

  // --- GRUPO E ---
  { id: 25, teamA: 'Alemania', flagA: '🇩🇪', teamB: 'Curazao', flagB: '🇨🇼', group: 'Grupo E', date: '14 Jun 2026 - 13:00', stadium: 'NRG Stadium, Houston', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 26, teamA: 'Costa de Marfil', flagA: '🇨🇮', teamB: 'Ecuador', flagB: '🇪🇨', group: 'Grupo E', date: '14 Jun 2026 - 17:00', stadium: 'AT&T Stadium, Dallas', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 27, teamA: 'Alemania', flagA: '🇩🇪', teamB: 'Costa de Marfil', flagB: '🇨🇮', group: 'Grupo E', date: '18 Jun 2026 - 15:00', stadium: 'SoFi Stadium, LA', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 28, teamA: 'Ecuador', flagA: '🇪🇨', teamB: 'Curazao', flagB: '🇨🇼', group: 'Grupo E', date: '18 Jun 2026 - 19:00', stadium: 'Levi\'s Stadium, SF', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 29, teamA: 'Ecuador', flagA: '🇪🇨', teamB: 'Alemania', flagB: '🇩🇪', group: 'Grupo E', date: '23 Jun 2026 - 16:00', stadium: 'MetLife Stadium, NY', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 30, teamA: 'Curazao', flagA: '🇨🇼', teamB: 'Costa de Marfil', flagB: '🇨🇮', group: 'Grupo E', date: '23 Jun 2026 - 20:00', stadium: 'BC Place, Vancouver', actualScoreA: null, actualScoreB: null, status: 'scheduled' },

  // --- GRUPO F ---
  { id: 31, teamA: 'Países Bajos', flagA: '🇳🇱', teamB: 'Japón', flagB: '🇯🇵', group: 'Grupo F', date: '14 Jun 2026 - 16:00', stadium: 'Mercedes-Benz Stadium, Atlanta', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 32, teamA: 'Suecia', flagA: '🇸🇪', teamB: 'Túnez', flagB: '🇹🇳', group: 'Grupo F', date: '14 Jun 2026 - 20:00', stadium: 'Gillette Stadium, Boston', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 33, teamA: 'Países Bajos', flagA: '🇳🇱', teamB: 'Suecia', flagB: '🇸🇪', group: 'Grupo F', date: '18 Jun 2026 - 16:00', stadium: 'Lincoln Financial Field, Philly', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 34, teamA: 'Túnez', flagA: '🇹🇳', teamB: 'Japón', flagB: '🇯🇵', group: 'Grupo F', date: '18 Jun 2026 - 20:00', stadium: 'Arrowhead Stadium, KC', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 35, teamA: 'Túnez', flagA: '🇹🇳', teamB: 'Países Bajos', flagB: '🇳🇱', group: 'Grupo F', date: '23 Jun 2026 - 15:00', stadium: 'Hard Rock Stadium, Miami', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 36, teamA: 'Japón', flagA: '🇯🇵', teamB: 'Suecia', flagB: '🇸🇪', group: 'Grupo F', date: '23 Jun 2026 - 19:00', stadium: 'Lumen Field, Seattle', actualScoreA: null, actualScoreB: null, status: 'scheduled' },

  // --- GRUPO G ---
  { id: 37, teamA: 'Bélgica', flagA: '🇧🇪', teamB: 'Egipto', flagB: '🇪🇬', group: 'Grupo G', date: '15 Jun 2026 - 12:00', stadium: 'Lumen Field, Seattle', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 38, teamA: 'Irán', flagA: '🇮🇷', teamB: 'Nueva Zelanda', flagB: '🇳🇿', group: 'Grupo G', date: '15 Jun 2026 - 16:00', stadium: 'Levi\'s Stadium, SF', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 39, teamA: 'Bélgica', flagA: '🇧🇪', teamB: 'Irán', flagB: '🇮🇷', group: 'Grupo G', date: '19 Jun 2026 - 15:00', stadium: 'Lincoln Financial Field, Philly', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 40, teamA: 'Nueva Zelanda', flagA: '🇳🇿', teamB: 'Egipto', flagB: '🇪🇬', group: 'Grupo G', date: '19 Jun 2026 - 19:00', stadium: 'Gillette Stadium, Boston', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 41, teamA: 'Nueva Zelanda', flagA: '🇳🇿', teamB: 'Bélgica', flagB: '🇧🇪', group: 'Grupo G', date: '24 Jun 2026 - 16:00', stadium: 'Arrowhead Stadium, KC', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 42, teamA: 'Egipto', flagA: '🇪🇬', teamB: 'Irán', flagB: '🇮🇷', group: 'Grupo G', date: '24 Jun 2026 - 20:00', stadium: 'SoFi Stadium, LA', actualScoreA: null, actualScoreB: null, status: 'scheduled' },

  // --- GRUPO H ---
  { id: 43, teamA: 'España', flagA: '🇪🇸', teamB: 'Cabo Verde', flagB: '🇨🇻', group: 'Grupo H', date: '15 Jun 2026 - 19:00', stadium: 'Levi\'s Stadium, Santa Clara', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 44, teamA: 'Arabia Saudita', flagA: '🇸🇦', teamB: 'Uruguay', flagB: '🇺🇾', group: 'Grupo H', date: '15 Jun 2026 - 22:00', stadium: 'BC Place, Vancouver', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 45, teamA: 'España', flagA: '🇪🇸', teamB: 'Arabia Saudita', flagB: '🇸🇦', group: 'Grupo H', date: '19 Jun 2026 - 16:00', stadium: 'SoFi Stadium, LA', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 46, teamA: 'Uruguay', flagA: '🇺🇾', teamB: 'Cabo Verde', flagB: '🇨🇻', group: 'Grupo H', date: '19 Jun 2026 - 20:00', stadium: 'Mercedes-Benz Stadium, Atlanta', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 47, teamA: 'Uruguay', flagA: '🇺🇾', teamB: 'España', flagB: '🇪🇸', group: 'Grupo H', date: '24 Jun 2026 - 15:00', stadium: 'MetLife Stadium, NY', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 48, teamA: 'Cabo Verde', flagA: '🇨🇻', teamB: 'Arabia Saudita', flagB: '🇸🇦', group: 'Grupo H', date: '24 Jun 2026 - 19:00', stadium: 'NRG Stadium, Houston', actualScoreA: null, actualScoreB: null, status: 'scheduled' },

  // --- GRUPO I ---
  { id: 49, teamA: 'Francia', flagA: '🇫🇷', teamB: 'Senegal', flagB: '🇸🇳', group: 'Grupo I', date: '16 Jun 2026 - 15:00', stadium: 'Gillette Stadium, Boston', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 50, teamA: 'Irak', flagA: '🇮🇶', teamB: 'Noruega', flagB: '🇳🇴', group: 'Grupo I', date: '16 Jun 2026 - 18:00', stadium: 'Hard Rock Stadium, Miami', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 51, teamA: 'Francia', flagA: '🇫🇷', teamB: 'Irak', flagB: '🇮🇶', group: 'Grupo I', date: '20 Jun 2026 - 15:00', stadium: 'Arrowhead Stadium, KC', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 52, teamA: 'Noruega', flagA: '🇳🇴', teamB: 'Senegal', flagB: '🇸🇳', group: 'Grupo I', date: '20 Jun 2026 - 19:00', stadium: 'Mercedes-Benz Stadium, Atlanta', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 53, teamA: 'Noruega', flagA: '🇳🇴', teamB: 'Francia', flagB: '🇫🇷', group: 'Grupo I', date: '25 Jun 2026 - 16:00', stadium: 'MetLife Stadium, NY', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 54, teamA: 'Senegal', flagA: '🇸🇳', teamB: 'Irak', flagB: '🇮🇶', group: 'Grupo I', date: '25 Jun 2026 - 20:00', stadium: 'Lincoln Financial Field, Philly', actualScoreA: null, actualScoreB: null, status: 'scheduled' },

  // --- GRUPO J ---
  { id: 55, teamA: 'Argentina', flagA: '🇦🇷', teamB: 'Argelia', flagB: '🇩🇿', group: 'Grupo J', date: '16 Jun 2026 - 21:00', stadium: 'SoFi Stadium, LA', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 56, teamA: 'Austria', flagA: '🇦🇹', teamB: 'Jordania', flagB: '🇯🇴', group: 'Grupo J', date: '16 Jun 2026 - 13:00', stadium: 'NRG Stadium, Houston', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 57, teamA: 'Argentina', flagA: '🇦🇷', teamB: 'Austria', flagB: '🇦🇹', group: 'Grupo J', date: '20 Jun 2026 - 18:00', stadium: 'Lumen Field, Seattle', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 58, teamA: 'Jordania', flagA: '🇯🇴', teamB: 'Argelia', flagB: '🇩🇿', group: 'Grupo J', date: '20 Jun 2026 - 21:00', stadium: 'BC Place, Vancouver', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 59, teamA: 'Jordania', flagA: '🇯🇴', teamB: 'Argentina', flagB: '🇦🇷', group: 'Grupo J', date: '25 Jun 2026 - 15:00', stadium: 'AT&T Stadium, Dallas', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 60, teamA: 'Argelia', flagA: '🇩🇿', teamB: 'Austria', flagB: '🇦🇹', group: 'Grupo J', date: '25 Jun 2026 - 19:00', stadium: 'Gillette Stadium, Boston', actualScoreA: null, actualScoreB: null, status: 'scheduled' },

  // --- GRUPO K ---
  { id: 61, teamA: 'Portugal', flagA: '🇵🇹', teamB: 'RD Congo', flagB: '🇨🇩', group: 'Grupo K', date: '17 Jun 2026 - 15:00', stadium: 'MetLife Stadium, NY', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 62, teamA: 'Uzbekistán', flagA: '🇺🇿', teamB: 'Colombia', flagB: '🇨🇴', group: 'Grupo K', date: '17 Jun 2026 - 19:00', stadium: 'Mercedes-Benz Stadium, Atlanta', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 63, teamA: 'Portugal', flagA: '🇵🇹', teamB: 'Uzbekistán', flagB: '🇺🇿', group: 'Grupo K', date: '21 Jun 2026 - 16:00', stadium: 'SoFi Stadium, LA', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 64, teamA: 'Colombia', flagA: '🇨🇴', teamB: 'RD Congo', flagB: '🇨🇩', group: 'Grupo K', date: '21 Jun 2026 - 20:00', stadium: 'Lumen Field, Seattle', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 65, teamA: 'Colombia', flagA: '🇨🇴', teamB: 'Portugal', flagB: '🇵🇹', group: 'Grupo K', date: '26 Jun 2026 - 15:00', stadium: 'Lincoln Financial Field, Philly', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 66, teamA: 'RD Congo', flagA: '🇨🇩', teamB: 'Uzbekistán', flagB: '🇺🇿', group: 'Grupo K', date: '26 Jun 2026 - 19:00', stadium: 'Hard Rock Stadium, Miami', actualScoreA: null, actualScoreB: null, status: 'scheduled' },

  // --- GRUPO L ---
  { id: 67, teamA: 'Inglaterra', flagA: '🏴\u200b󠁧\u200b󠁢\u200b󠁥\u200b󠁮\u200b󠁧\u200b󠁿', teamB: 'Croacia', flagB: '🇭🇷', group: 'Grupo L', date: '17 Jun 2026 - 18:00', stadium: 'Gillette Stadium, Boston', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 68, teamA: 'Ghana', flagA: '🇬🇭', teamB: 'Panamá', flagB: '🇵🇦', group: 'Grupo L', date: '17 Jun 2026 - 21:00', stadium: 'Arrowhead Stadium, KC', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 69, teamA: 'Inglaterra', flagA: '🏴\u200b󠁧\u200b󠁢\u200b󠁥\u200b󠁮\u200b󠁧\u200b󠁿', teamB: 'Ghana', flagB: '🇬🇭', group: 'Grupo L', date: '22 Jun 2026 - 15:00', stadium: 'Lincoln Financial Field, Philly', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 70, teamA: 'Panamá', flagA: '🇵🇦', teamB: 'Croacia', flagB: '🇭🇷', group: 'Grupo L', date: '22 Jun 2026 - 19:00', stadium: 'Mercedes-Benz Stadium, Atlanta', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 71, teamA: 'Panamá', flagA: '🇵🇦', teamB: 'Inglaterra', flagB: '🏴\u200b󠁧\u200b󠁢\u200b󠁥\u200b󠁮\u200b󠁧\u200b󠁿', group: 'Grupo L', date: '26 Jun 2026 - 16:00', stadium: 'SoFi Stadium, LA', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 72, teamA: 'Croacia', flagA: '🇭🇷', teamB: 'Ghana', flagB: '🇬🇭', group: 'Grupo L', date: '26 Jun 2026 - 20:00', stadium: 'MetLife Stadium, NY', actualScoreA: null, actualScoreB: null, status: 'scheduled' }
];
