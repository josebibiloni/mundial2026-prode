export const initialMatches = [
  // --- GRUPO A ---
  { id: 1, teamA: 'México', flagA: '🇲🇽', teamB: 'Sudáfrica', flagB: '🇿🇦', group: 'Grupo A', date: '11 Jun 2026 - 15:00', stadium: 'Estadio Azteca, CDMX', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 2, teamA: 'Corea del Sur', flagA: '🇰🇷', teamB: 'Czechia', flagB: '🇨🇿', group: 'Grupo A', date: '11 Jun 2026 - 18:00', stadium: 'MetLife Stadium, NY', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 3, teamA: 'México', flagA: '🇲🇽', teamB: 'Corea del Sur', flagB: '🇰🇷', group: 'Grupo A', date: '15 Jun 2026 - 15:00', stadium: 'Mercedes-Benz Stadium, Atlanta', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 4, teamA: 'Czechia', flagA: '🇨🇿', teamB: 'Sudáfrica', flagB: '🇿🇦', group: 'Grupo A', date: '15 Jun 2026 - 19:00', stadium: 'Gillette Stadium, Boston', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 5, teamA: 'Czechia', flagA: '🇨🇿', teamB: 'México', flagB: '🇲🇽', group: 'Grupo A', date: '20 Jun 2026 - 16:00', stadium: 'NRG Stadium, Houston', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 6, teamA: 'Sudáfrica', flagA: '🇿🇦', teamB: 'Corea del Sur', flagB: '🇰🇷', group: 'Grupo A', date: '20 Jun 2026 - 20:00', stadium: 'SoFi Stadium, LA', actualScoreA: null, actualScoreB: null, status: 'scheduled' },

  // --- GRUPO B ---
  { id: 7, teamA: 'Canadá', flagA: '🇨🇦', teamB: 'Argelia', flagB: '🇩🇿', group: 'Grupo B', date: '12 Jun 2026 - 21:00', stadium: 'BMO Field, Toronto', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 8, teamA: 'Qatar', flagA: '🇶🇦', teamB: 'Suiza', flagB: '🇨🇭', group: 'Grupo B', date: '12 Jun 2026 - 15:00', stadium: 'BC Place, Vancouver', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 9, teamA: 'Canadá', flagA: '🇨🇦', teamB: 'Qatar', flagB: '🇶🇦', group: 'Grupo B', date: '16 Jun 2026 - 18:00', stadium: 'Lumen Field, Seattle', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 10, teamA: 'Suiza', flagA: '🇨🇭', teamB: 'Argelia', flagB: '🇩🇿', group: 'Grupo B', date: '16 Jun 2026 - 21:00', stadium: 'Levi\'s Stadium, SF', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 11, teamA: 'Suiza', flagA: '🇨🇭', teamB: 'Canadá', flagB: '🇨🇦', group: 'Grupo B', date: '21 Jun 2026 - 15:00', stadium: 'Lincoln Financial Field, Philly', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 12, teamA: 'Argelia', flagA: '🇩🇿', teamB: 'Qatar', flagB: '🇶🇦', group: 'Grupo B', date: '21 Jun 2026 - 19:00', stadium: 'Hard Rock Stadium, Miami', actualScoreA: null, actualScoreB: null, status: 'scheduled' },

  // --- GRUPO C ---
  { id: 13, teamA: 'Argentina', flagA: '🇦🇷', teamB: 'Suecia', flagB: '🇸🇪', group: 'Grupo C', date: '13 Jun 2026 - 14:00', stadium: 'MetLife Stadium, New Jersey', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 14, teamA: 'Austria', flagA: '🇦🇹', teamB: 'Jordania', flagB: '🇯🇴', group: 'Grupo C', date: '13 Jun 2026 - 18:00', stadium: 'AT&T Stadium, Dallas', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 15, teamA: 'Argentina', flagA: '🇦🇷', teamB: 'Austria', flagB: '🇦🇹', group: 'Grupo C', date: '17 Jun 2026 - 15:00', stadium: 'Arrowhead Stadium, KC', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 16, teamA: 'Jordania', flagA: '🇯🇴', teamB: 'Suecia', flagB: '🇸🇪', group: 'Grupo C', date: '17 Jun 2026 - 19:00', stadium: 'Mercedes-Benz Stadium, Atlanta', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 17, teamA: 'Jordania', flagA: '🇯🇴', teamB: 'Argentina', flagB: '🇦🇷', group: 'Grupo C', date: '22 Jun 2026 - 16:00', stadium: 'Lincoln Financial Field, Philly', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 18, teamA: 'Suecia', flagA: '🇸🇪', teamB: 'Austria', flagB: '🇦🇹', group: 'Grupo C', date: '22 Jun 2026 - 20:00', stadium: 'Gillette Stadium, Boston', actualScoreA: null, actualScoreB: null, status: 'scheduled' },

  // --- GRUPO D ---
  { id: 19, teamA: 'España', flagA: '🇪🇸', teamB: 'Japón', flagB: '🇯🇵', group: 'Grupo D', date: '13 Jun 2026 - 17:00', stadium: 'Hard Rock Stadium, Miami', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 20, teamA: 'Cabo Verde', flagA: '🇨🇻', teamB: 'Arabia Saudita', flagB: '🇸🇦', group: 'Grupo D', date: '13 Jun 2026 - 21:00', stadium: 'NRG Stadium, Houston', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 21, teamA: 'España', flagA: '🇪🇸', teamB: 'Cabo Verde', flagB: '🇨🇻', group: 'Grupo D', date: '17 Jun 2026 - 16:00', stadium: 'SoFi Stadium, LA', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 22, teamA: 'Arabia Saudita', flagA: '🇸🇦', teamB: 'Japón', flagB: '🇯🇵', group: 'Grupo D', date: '17 Jun 2026 - 20:00', stadium: 'BC Place, Vancouver', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 23, teamA: 'Arabia Saudita', flagA: '🇸🇦', teamB: 'España', flagB: '🇪🇸', group: 'Grupo D', date: '22 Jun 2026 - 15:00', stadium: 'Arrowhead Stadium, KC', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 24, teamA: 'Japón', flagA: '🇯🇵', teamB: 'Cabo Verde', flagB: '🇨🇻', group: 'Grupo D', date: '22 Jun 2026 - 19:00', stadium: 'MetLife Stadium, NY', actualScoreA: null, actualScoreB: null, status: 'scheduled' },

  // --- GRUPO E ---
  { id: 25, teamA: 'Brasil', flagA: '🇧🇷', teamB: 'Camerún', flagB: '🇨🇲', group: 'Grupo E', date: '14 Jun 2026 - 13:00', stadium: 'NRG Stadium, Houston', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 26, teamA: 'Ecuador', flagA: '🇪🇨', teamB: 'Alemania', flagB: '🇩🇪', group: 'Grupo E', date: '14 Jun 2026 - 17:00', stadium: 'AT&T Stadium, Dallas', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 27, teamA: 'Brasil', flagA: '🇧🇷', teamB: 'Ecuador', flagB: '🇪🇨', group: 'Grupo E', date: '18 Jun 2026 - 15:00', stadium: 'SoFi Stadium, LA', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 28, teamA: 'Alemania', flagA: '🇩🇪', teamB: 'Camerún', flagB: '🇨🇲', group: 'Grupo E', date: '18 Jun 2026 - 19:00', stadium: 'Levi\'s Stadium, SF', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 29, teamA: 'Alemania', flagA: '🇩🇪', teamB: 'Brasil', flagB: '🇧🇷', group: 'Grupo E', date: '23 Jun 2026 - 16:00', stadium: 'MetLife Stadium, NY', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 30, teamA: 'Camerún', flagA: '🇨🇲', teamB: 'Ecuador', flagB: '🇪🇨', group: 'Grupo E', date: '23 Jun 2026 - 20:00', stadium: 'BC Place, Vancouver', actualScoreA: null, actualScoreB: null, status: 'scheduled' },

  // --- GRUPO F ---
  { id: 31, teamA: 'Francia', flagA: '🇫🇷', teamB: 'Senegal', flagB: '🇸🇳', group: 'Grupo F', date: '14 Jun 2026 - 16:00', stadium: 'Mercedes-Benz Stadium, Atlanta', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 32, teamA: 'Noruega', flagA: '🇳🇴', teamB: 'Irak', flagB: '🇮🇶', group: 'Grupo F', date: '14 Jun 2026 - 20:00', stadium: 'Gillette Stadium, Boston', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 33, teamA: 'Francia', flagA: '🇫🇷', teamB: 'Noruega', flagB: '🇳🇴', group: 'Grupo F', date: '18 Jun 2026 - 16:00', stadium: 'Lincoln Financial Field, Philly', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 34, teamA: 'Irak', flagA: '🇮🇶', teamB: 'Senegal', flagB: '🇸🇳', group: 'Grupo F', date: '18 Jun 2026 - 20:00', stadium: 'Arrowhead Stadium, KC', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 35, teamA: 'Irak', flagA: '🇮🇶', teamB: 'Francia', flagB: '🇫🇷', group: 'Grupo F', date: '23 Jun 2026 - 15:00', stadium: 'Hard Rock Stadium, Miami', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 36, teamA: 'Senegal', flagA: '🇸🇳', teamB: 'Noruega', flagB: '🇳🇴', group: 'Grupo F', date: '23 Jun 2026 - 19:00', stadium: 'Lumen Field, Seattle', actualScoreA: null, actualScoreB: null, status: 'scheduled' },

  // --- GRUPO G ---
  { id: 37, teamA: 'Inglaterra', flagA: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', teamB: 'Croacia', flagB: '🇭🇷', group: 'Grupo G', date: '15 Jun 2026 - 12:00', stadium: 'Lumen Field, Seattle', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 38, teamA: 'Ghana', flagA: '🇬🇭', teamB: 'Panamá', flagB: '🇵🇦', group: 'Grupo G', date: '15 Jun 2026 - 16:00', stadium: 'Levi\'s Stadium, SF', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 39, teamA: 'Inglaterra', flagA: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', teamB: 'Ghana', flagB: '🇬🇭', group: 'Grupo G', date: '19 Jun 2026 - 15:00', stadium: 'Lincoln Financial Field, Philly', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 40, teamA: 'Panamá', flagA: '🇵🇦', teamB: 'Croacia', flagB: '🇭🇷', group: 'Grupo G', date: '19 Jun 2026 - 19:00', stadium: 'Gillette Stadium, Boston', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 41, teamA: 'Panamá', flagA: '🇵🇦', teamB: 'Inglaterra', flagB: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'Grupo G', date: '24 Jun 2026 - 16:00', stadium: 'Arrowhead Stadium, KC', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 42, teamA: 'Croacia', flagA: '🇭🇷', teamB: 'Ghana', flagB: '🇬🇭', group: 'Grupo G', date: '24 Jun 2026 - 20:00', stadium: 'SoFi Stadium, LA', actualScoreA: null, actualScoreB: null, status: 'scheduled' },

  // --- GRUPO H ---
  { id: 43, teamA: 'Uruguay', flagA: '🇺🇾', teamB: 'Marruecos', flagB: '🇲🇦', group: 'Grupo H', date: '15 Jun 2026 - 19:00', stadium: 'Levi\'s Stadium, Santa Clara', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 44, teamA: 'Escocia', flagA: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', teamB: 'Haití', flagB: '🇭🇹', group: 'Grupo H', date: '15 Jun 2026 - 22:00', stadium: 'BC Place, Vancouver', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 45, teamA: 'Uruguay', flagA: '🇺🇾', teamB: 'Escocia', flagB: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'Grupo H', date: '19 Jun 2026 - 16:00', stadium: 'SoFi Stadium, LA', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 46, teamA: 'Haití', flagA: '🇭🇹', teamB: 'Marruecos', flagB: '🇲🇦', group: 'Grupo H', date: '19 Jun 2026 - 20:00', stadium: 'Mercedes-Benz Stadium, Atlanta', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 47, teamA: 'Haití', flagA: '🇭🇹', teamB: 'Uruguay', flagB: '🇺🇾', group: 'Grupo H', date: '24 Jun 2026 - 15:00', stadium: 'MetLife Stadium, NY', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 48, teamA: 'Marruecos', flagA: '🇲🇦', teamB: 'Escocia', flagB: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'Grupo H', date: '24 Jun 2026 - 19:00', stadium: 'NRG Stadium, Houston', actualScoreA: null, actualScoreB: null, status: 'scheduled' },

  // --- GRUPO I ---
  { id: 49, teamA: 'Alemania', flagA: '🇩🇪', teamB: 'Colombia', flagB: '🇨🇴', group: 'Grupo I', date: '16 Jun 2026 - 15:00', stadium: 'Gillette Stadium, Boston', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 50, teamA: 'Curazao', flagA: '🇨🇼', teamB: 'Costa de Marfil', flagB: '🇨🇮', group: 'Grupo I', date: '16 Jun 2026 - 18:00', stadium: 'Hard Rock Stadium, Miami', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 51, teamA: 'Alemania', flagA: '🇩🇪', teamB: 'Curazao', flagB: '🇨🇼', group: 'Grupo I', date: '20 Jun 2026 - 15:00', stadium: 'Arrowhead Stadium, KC', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 52, teamA: 'Costa de Marfil', flagA: '🇨🇮', teamB: 'Colombia', flagB: '🇨🇴', group: 'Grupo I', date: '20 Jun 2026 - 19:00', stadium: 'Mercedes-Benz Stadium, Atlanta', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 53, teamA: 'Costa de Marfil', flagA: '🇨🇮', teamB: 'Alemania', flagB: '🇩🇪', group: 'Grupo I', date: '25 Jun 2026 - 16:00', stadium: 'MetLife Stadium, NY', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 54, teamA: 'Colombia', flagA: '🇨🇴', teamB: 'Curazao', flagB: '🇨🇼', group: 'Grupo I', date: '25 Jun 2026 - 20:00', stadium: 'Lincoln Financial Field, Philly', actualScoreA: null, actualScoreB: null, status: 'scheduled' },

  // --- GRUPO J ---
  { id: 55, teamA: 'Estados Unidos', flagA: '🇺🇸', teamB: 'Australia', flagB: '🇦🇺', group: 'Grupo J', date: '16 Jun 2026 - 21:00', stadium: 'SoFi Stadium, LA', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 56, teamA: 'Turquía', flagA: '🇹🇷', teamB: 'Paraguay', flagB: '🇵🇾', group: 'Grupo J', date: '16 Jun 2026 - 13:00', stadium: 'NRG Stadium, Houston', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 57, teamA: 'Estados Unidos', flagA: '🇺🇸', teamB: 'Turquía', flagB: '🇹🇷', group: 'Grupo J', date: '20 Jun 2026 - 18:00', stadium: 'Lumen Field, Seattle', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 58, teamA: 'Paraguay', flagA: '🇵🇾', teamB: 'Australia', flagB: '🇦🇺', group: 'Grupo J', date: '20 Jun 2026 - 21:00', stadium: 'BC Place, Vancouver', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 59, teamA: 'Paraguay', flagA: '🇵🇾', teamB: 'Estados Unidos', flagB: '🇺🇸', group: 'Grupo J', date: '25 Jun 2026 - 15:00', stadium: 'AT&T Stadium, Dallas', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 60, teamA: 'Australia', flagA: '🇦🇺', teamB: 'Turquía', flagB: '🇹🇷', group: 'Grupo J', date: '25 Jun 2026 - 19:00', stadium: 'Gillette Stadium, Boston', actualScoreA: null, actualScoreB: null, status: 'scheduled' },

  // --- GRUPO K ---
  { id: 61, teamA: 'Portugal', flagA: '🇵🇹', teamB: 'Uzbekistán', flagB: '🇺🇿', group: 'Grupo K', date: '17 Jun 2026 - 15:00', stadium: 'MetLife Stadium, NY', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 62, teamA: 'RD Congo', flagA: '🇨🇩', teamB: 'Bélgica', flagB: '🇧🇪', group: 'Grupo K', date: '17 Jun 2026 - 19:00', stadium: 'Mercedes-Benz Stadium, Atlanta', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 63, teamA: 'Portugal', flagA: '🇵🇹', teamB: 'RD Congo', flagB: '🇨🇩', group: 'Grupo K', date: '21 Jun 2026 - 16:00', stadium: 'SoFi Stadium, LA', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 64, teamA: 'Bélgica', flagA: '🇧🇪', teamB: 'Uzbekistán', flagB: '🇺🇿', group: 'Grupo K', date: '21 Jun 2026 - 20:00', stadium: 'Lumen Field, Seattle', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 65, teamA: 'Bélgica', flagA: '🇧🇪', teamB: 'Portugal', flagB: '🇵🇹', group: 'Grupo K', date: '26 Jun 2026 - 15:00', stadium: 'Lincoln Financial Field, Philly', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 66, teamA: 'Uzbekistán', flagA: '🇺🇿', teamB: 'RD Congo', flagB: '🇨🇩', group: 'Grupo K', date: '26 Jun 2026 - 19:00', stadium: 'Hard Rock Stadium, Miami', actualScoreA: null, actualScoreB: null, status: 'scheduled' },

  // --- GRUPO L ---
  { id: 67, teamA: 'Holanda', flagA: '🇳🇱', teamB: 'Túnez', flagB: '🇹🇳', group: 'Grupo L', date: '17 Jun 2026 - 18:00', stadium: 'Gillette Stadium, Boston', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 68, teamA: 'Croacia', flagA: '🇭🇷', teamB: 'Panamá', flagB: '🇵🇦', group: 'Grupo L', date: '17 Jun 2026 - 21:00', stadium: 'Arrowhead Stadium, KC', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 69, teamA: 'Holanda', flagA: '🇳🇱', teamB: 'Croacia', flagB: '🇭🇷', group: 'Grupo L', date: '22 Jun 2026 - 15:00', stadium: 'Lincoln Financial Field, Philly', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 70, teamA: 'Panamá', flagA: '🇵🇦', teamB: 'Túnez', flagB: '🇹🇳', group: 'Grupo L', date: '22 Jun 2026 - 19:00', stadium: 'Mercedes-Benz Stadium, Atlanta', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 71, teamA: 'Panamá', flagA: '🇵🇦', teamB: 'Holanda', flagB: '🇳🇱', group: 'Grupo L', date: '26 Jun 2026 - 16:00', stadium: 'SoFi Stadium, LA', actualScoreA: null, actualScoreB: null, status: 'scheduled' },
  { id: 72, teamA: 'Túnez', flagA: '🇹🇳', teamB: 'Croacia', flagB: '🇭🇷', group: 'Grupo L', date: '26 Jun 2026 - 20:00', stadium: 'MetLife Stadium, NY', actualScoreA: null, actualScoreB: null, status: 'scheduled' }
];
