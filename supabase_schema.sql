-- Esquema SQL para Prode Mundial 2026

-- 1. Tabla de Grupos (Tenants)
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Participantes
CREATE TABLE IF NOT EXISTS participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  username TEXT NOT NULL,          -- Apodo / Nickname (Debe ser único por grupo)
  full_name TEXT NOT NULL,         -- Nombre Real
  mystic_phrase TEXT DEFAULT '',   -- Frase Mística
  whatsapp TEXT NOT NULL,          -- Últimos 8 dígitos de Whatsapp (Login ID)
  pin TEXT NOT NULL,               -- PIN de 4 dígitos (Login Password)
  is_admin BOOLEAN DEFAULT false,
  stripe_color_1 TEXT DEFAULT '#ff0055', -- Color de castigo 1
  stripe_color_2 TEXT DEFAULT '#00ff87', -- Color de castigo 2
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, username),
  UNIQUE (tenant_id, whatsapp)     -- Whatsapp único por grupo
);

-- 3. Tabla de Partidos (Fixture global)
CREATE TABLE IF NOT EXISTS matches (
  id INT PRIMARY KEY,
  team_a TEXT NOT NULL,
  flag_a TEXT NOT NULL,
  team_b TEXT NOT NULL,
  flag_b TEXT NOT NULL,
  group_name TEXT NOT NULL,
  match_date TEXT NOT NULL,
  stadium TEXT NOT NULL,
  actual_score_a INT DEFAULT NULL,
  actual_score_b INT DEFAULT NULL,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'played'
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de Pronósticos (Predicciones de cada usuario, referenciadas por participant_id)
CREATE TABLE IF NOT EXISTS predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  match_id INT REFERENCES matches(id) ON DELETE CASCADE,
  score_a INT NOT NULL,
  score_b INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, participant_id, match_id)
);

-- 5. Mensajes Diarios del Top 3
CREATE TABLE IF NOT EXISTS daily_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  first_nick TEXT NOT NULL,
  first_msg TEXT NOT NULL,
  second_nick TEXT NOT NULL,
  second_msg TEXT NOT NULL,
  third_nick TEXT NOT NULL,
  third_msg TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar partidos iniciales en la tabla matches (Fixture inicial de prueba)
INSERT INTO matches (id, team_a, flag_a, team_b, flag_b, group_name, match_date, stadium) VALUES
(1, 'México', '🇲🇽', 'Sudáfrica', '🇿🇦', 'Grupo A', '11 Jun 2026 - 15:00', 'Estadio Azteca, CDMX') ON CONFLICT DO NOTHING;
INSERT INTO matches (id, team_a, flag_a, team_b, flag_b, group_name, match_date, stadium) VALUES
(2, 'Estados Unidos', '🇺🇸', 'Australia', '🇦🇺', 'Grupo A', '12 Jun 2026 - 18:00', 'SoFi Stadium, Los Angeles') ON CONFLICT DO NOTHING;
INSERT INTO matches (id, team_a, flag_a, team_b, flag_b, group_name, match_date, stadium) VALUES
(3, 'Canadá', '🇨🇦', 'Argelia', '🇩🇿', 'Grupo B', '12 Jun 2026 - 21:00', 'BMO Field, Toronto') ON CONFLICT DO NOTHING;
INSERT INTO matches (id, team_a, flag_a, team_b, flag_b, group_name, match_date, stadium) VALUES
(4, 'Argentina', '🇦🇷', 'Suecia', '🇸🇪', 'Grupo C', '13 Jun 2026 - 14:00', 'MetLife Stadium, New Jersey') ON CONFLICT DO NOTHING;
INSERT INTO matches (id, team_a, flag_a, team_b, flag_b, group_name, match_date, stadium) VALUES
(5, 'España', '🇪🇸', 'Japón', '🇯🇵', 'Grupo D', '13 Jun 2026 - 17:00', 'Hard Rock Stadium, Miami') ON CONFLICT DO NOTHING;
INSERT INTO matches (id, team_a, flag_a, team_b, flag_b, group_name, match_date, stadium) VALUES
(6, 'Brasil', '🇧🇷', 'Camerún', '🇨🇲', 'Grupo E', '14 Jun 2026 - 13:00', 'NRG Stadium, Houston') ON CONFLICT DO NOTHING;
INSERT INTO matches (id, team_a, flag_a, team_b, flag_b, group_name, match_date, stadium) VALUES
(7, 'Francia', '🇫🇷', 'Ecuador', '🇪🇨', 'Grupo F', '14 Jun 2026 - 16:00', 'Mercedes-Benz Stadium, Atlanta') ON CONFLICT DO NOTHING;
INSERT INTO matches (id, team_a, flag_a, team_b, flag_b, group_name, match_date, stadium) VALUES
(8, 'Inglaterra', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Corea del Sur', '🇰🇷', 'Grupo G', '15 Jun 2026 - 12:00', 'Lumen Field, Seattle') ON CONFLICT DO NOTHING;
INSERT INTO matches (id, team_a, flag_a, team_b, flag_b, group_name, match_date, stadium) VALUES
(9, 'Uruguay', '🇺🇾', 'Marruecos', '🇲🇦', 'Grupo H', '15 Jun 2026 - 19:00', 'Levi\'s Stadium, Santa Clara') ON CONFLICT DO NOTHING;
INSERT INTO matches (id, team_a, flag_a, team_b, flag_b, group_name, match_date, stadium) VALUES
(10, 'Alemania', '🇩🇪', 'Colombia', '🇨🇴', 'Grupo I', '16 Jun 2026 - 15:00', 'Gillette Stadium, Boston') ON CONFLICT DO NOTHING;

-- 6. Tabla de Eventos de Boludeo (Banter/Humillación temporal)
CREATE TABLE IF NOT EXISTS boludeo_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  triggered_by_username TEXT NOT NULL,
  stripe_color_1 TEXT NOT NULL,
  stripe_color_2 TEXT NOT NULL,
  mystic_phrase TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
