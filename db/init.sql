-- Schema + seed do laboratorio Ataque x Defesa.
-- Executado automaticamente pelo container do Postgres (docker-entrypoint-initdb.d).
-- O defesa-api roda com spring.jpa.hibernate.ddl-auto=none: este arquivo e a
-- unica fonte de verdade para o schema.

CREATE TABLE IF NOT EXISTS usuarios (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(100) NOT NULL UNIQUE,
    senha_hash  VARCHAR(100) NOT NULL,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tentativas_login (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(100) NOT NULL,
    ip          VARCHAR(45) NOT NULL,
    status      VARCHAR(20) NOT NULL CHECK (status IN ('SUCESSO', 'FALHA', 'BLOQUEADO')),
    timestamp   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tentativas_username ON tentativas_login (username);
CREATE INDEX IF NOT EXISTS idx_tentativas_ip ON tentativas_login (ip);
CREATE INDEX IF NOT EXISTS idx_tentativas_timestamp ON tentativas_login (timestamp DESC);

-- Usuarios de teste. Senhas em texto puro (apenas para referencia de quem for
-- rodar o ataque-cli com a wordlist) e seus hashes BCrypt correspondentes:
--   admin           / admin123
--   joao.silva      / 123456
--   maria.souza     / senha123
--   carlos.pereira  / password
--   ana.costa       / qwerty123
INSERT INTO usuarios (username, senha_hash) VALUES
    ('admin',          '$2b$10$MaR2/MhW3PLMG2b1T8b2nuQc91cl8hwoIyUkTR/x1Ql/NFVlTv8GW'),
    ('joao.silva',     '$2b$10$KqbBpa6ulaJE9Ayq9adUoePOicTYvUPx/S2pmeMrnulxSp9T5Usz6'),
    ('maria.souza',    '$2b$10$UMlx8wxNSIFsQKLwChMkue56BabgbguUeRNApnOIzz0WbRE5Nd0Da'),
    ('carlos.pereira', '$2b$10$u6RIYndKKEOefTPJVB78b.XBfw.SrRsGbu2Czc9ZIbXwcjdQXz5t6'),
    ('ana.costa',      '$2b$10$yBurGFk7exChYshYY/qWzu5HDd/Q8HVTrw2XAMMRYu7ZRt28vPpga')
ON CONFLICT (username) DO NOTHING;

-- Tabela de logs comeca vazia: e populada pelo defesa-api conforme os
-- logins (legitimos ou do ataque-cli) acontecem.
