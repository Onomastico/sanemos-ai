-- ============================================================
-- sanemos.ai — Phase 10: Resource Details & LATAM Seed
-- ============================================================

-- 1. Add new columns to `resources` table
ALTER TABLE resources ADD COLUMN IF NOT EXISTS author_or_creator TEXT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS focus_theme TEXT;
ALTER TABLE resources ADD COLUMN IF NOT EXISTS availability TEXT;

-- 2. Insert LATAM Data

-- We will insert resources and optionally configure loss_types in a separate step or via a DO block.
-- For simplicity, we insert into `resources` and get IDs, but since UUIDs are random, we can generate them or use a CTE.

DO $$
DECLARE
    admin_id UUID;
    r_id UUID;
BEGIN
    -- Try to find an admin user to attribute these resources to (if none, they stay NULL)
    SELECT id INTO admin_id FROM profiles WHERE role = 'admin' LIMIT 1;
    
    -- ==========================================================
    -- TABLA 1: Referencia Clínica / Teoría
    -- ==========================================================
    
    -- 1. Sobre el duelo y el dolor
    INSERT INTO resources (created_by, title, description, type, worldview, avg_rating, author_or_creator, focus_theme, availability, metadata)
    VALUES (admin_id, 'Sobre el duelo y el dolor', 'Libro clave sobre las etapas del duelo', 'book', 'universal', 4.8, 'E. Kübler-Ross / D. Kessler', 'Etapas del Duelo', 'Buscalibre (Alta)', '{"precio_estimado_clp": "$27.520"}')
    RETURNING id INTO r_id;
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'general');

    -- 2. Aprender de la pérdida
    INSERT INTO resources (created_by, title, description, type, worldview, avg_rating, author_or_creator, focus_theme, availability, metadata)
    VALUES (admin_id, 'Aprender de la pérdida', 'Enfoque constructivista sobre la pérdida', 'book', 'universal', 4.7, 'Robert A. Neimeyer', 'Constructivista', 'Planeta (Alta)', '{"precio_estimado_clp": "$18.550"}')
    RETURNING id INTO r_id;
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'general');

    -- 3. El tratamiento del duelo
    INSERT INTO resources (created_by, title, description, type, worldview, avg_rating, author_or_creator, focus_theme, availability, metadata)
    VALUES (admin_id, 'El tratamiento del duelo', 'Aborda las tareas del duelo', 'book', 'universal', 4.9, 'J. William Worden', 'Tareas del Duelo', 'Paidós (Media)', '{"precio_estimado_clp": "$32.490"}')
    RETURNING id INTO r_id;
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'general');

    -- 4. La rueda de la vida
    INSERT INTO resources (created_by, title, description, type, worldview, avg_rating, author_or_creator, focus_theme, availability, metadata)
    VALUES (admin_id, 'La rueda de la vida', 'Obra biográfica y espiritual', 'book', 'spiritual', 4.7, 'E. Kübler-Ross', 'Biográfico/Espiritual', 'Vergara (Alta)', '{"precio_estimado_clp": "$7.800"}')
    RETURNING id INTO r_id;
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'other');

    -- 5. El camino de las lágrimas
    INSERT INTO resources (created_by, title, description, type, worldview, avg_rating, author_or_creator, focus_theme, availability, metadata)
    VALUES (admin_id, 'El camino de las lágrimas', 'Relato terapéutico', 'book', 'universal', 4.6, 'Jorge Bucay', 'Terapéutico/Relato', 'Océano (Alta)', '{"precio_estimado_clp": "$17.570"}')
    RETURNING id INTO r_id;
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'general');

    -- ==========================================================
    -- TABLA 2: Literatura, Testimonio, Memorias
    -- ==========================================================

    -- 1. Diario de duelo
    INSERT INTO resources (created_by, title, description, type, worldview, avg_rating, author_or_creator, focus_theme, availability, metadata)
    VALUES (admin_id, 'Diario de duelo', 'Experiencia personal de la pérdida de la madre', 'book', 'universal', 4.1, 'Roland Barthes', 'Pérdida de la madre', 'Buscalibre/Librerías', '{}')
    RETURNING id INTO r_id;
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'parent');

    -- 2. El año del pensamiento mágico
    INSERT INTO resources (created_by, title, description, type, worldview, avg_rating, author_or_creator, focus_theme, availability, metadata)
    VALUES (admin_id, 'El año del pensamiento mágico', 'Sobre la muerte repentina y el impacto del duelo', 'book', 'universal', 4.2, 'Joan Didion', 'Muerte repentina', 'Buscalibre/Anagrama', '{}')
    RETURNING id INTO r_id;
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'partner');

    -- 3. Lo que no tiene nombre
    INSERT INTO resources (created_by, title, description, type, worldview, avg_rating, author_or_creator, focus_theme, availability, metadata)
    VALUES (admin_id, 'Lo que no tiene nombre', 'Conmovedor testimonio sobre el suicidio de un hijo', 'book', 'universal', 4.5, 'Piedad Bonett', 'Suicidio de un hijo', 'Alfaguara/Digital', '{}')
    RETURNING id INTO r_id;
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'child');

    -- 4. La ridícula idea de no volver a verte
    INSERT INTO resources (created_by, title, description, type, worldview, avg_rating, author_or_creator, focus_theme, availability, metadata)
    VALUES (admin_id, 'La ridícula idea de no volver a verte', 'Reflexión sobre la viudez y la resiliencia', 'book', 'universal', 4.3, 'Rosa Montero', 'Viudez y resiliencia', 'Seix Barral', '{}')
    RETURNING id INTO r_id;
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'partner');

    -- 5. Di su nombre
    INSERT INTO resources (created_by, title, description, type, worldview, avg_rating, author_or_creator, focus_theme, availability, metadata)
    VALUES (admin_id, 'Di su nombre', 'Novela sobre un accidente, la pérdida y la culpa', 'book', 'universal', 4.0, 'Francisco Goldman', 'Accidente y culpa', 'Buscalibre', '{}')
    RETURNING id INTO r_id;
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'partner');

    -- ==========================================================
    -- TABLA 3: Cine y Series
    -- ==========================================================
    
    INSERT INTO resources (created_by, title, description, type, worldview, avg_rating, author_or_creator, focus_theme, availability, metadata)
    VALUES (admin_id, 'Pieces of a Woman', 'Drama sobre la pérdida', 'movie', 'universal', 3.5, 'Kornél Mundruczó', 'Drama', 'Netflix', '{"formato_calidad": "4K/HDR"}')
    RETURNING id INTO r_id;
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'child');

    INSERT INTO resources (created_by, title, description, type, worldview, avg_rating, author_or_creator, focus_theme, availability, metadata)
    VALUES (admin_id, 'Manchester by the Sea', 'Película aclamada sobre el duelo y la tragedia familiar', 'movie', 'universal', 3.9, 'Kenneth Lonergan', 'Tragedia familiar', 'Prime Video / Netflix', '{"formato_calidad": "HD"}')
    RETURNING id INTO r_id;
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'other');

    INSERT INTO resources (created_by, title, description, type, worldview, avg_rating, author_or_creator, focus_theme, availability, metadata)
    VALUES (admin_id, 'Roma', 'Retrato realista y nostálgico de la vida', 'movie', 'universal', 3.8, 'Alfonso Cuarón', 'Drama/Memoria', 'Netflix', '{"formato_calidad": "4K"}')
    RETURNING id INTO r_id;
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'other');

    INSERT INTO resources (created_by, title, description, type, worldview, avg_rating, author_or_creator, focus_theme, availability, metadata)
    VALUES (admin_id, 'After Yang', 'Ciencia ficción reflexiva sobre la pérdida de un ser querido', 'movie', 'universal', 3.5, 'Kogonada', 'Pérdida/Sci-Fi', 'Max', '{"formato_calidad": "HD"}')
    RETURNING id INTO r_id;
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'other');

    INSERT INTO resources (created_by, title, description, type, worldview, avg_rating, author_or_creator, focus_theme, availability, metadata)
    VALUES (admin_id, 'Up', 'Aventura entrañable que inicia con la pérdida de la pareja', 'movie', 'universal', 4.1, 'Pete Docter', 'Animación/Pérdida', 'Disney+', '{"formato_calidad": "4K"}')
    RETURNING id INTO r_id;
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'partner');

    INSERT INTO resources (created_by, title, description, type, worldview, avg_rating, author_or_creator, focus_theme, availability, metadata)
    VALUES (admin_id, 'The Farewell', 'Una mentira piadosa reúne a una familia ante la enfermedad', 'movie', 'universal', 3.7, 'Lulu Wang', 'Enfermedad familiar', 'Prime Video', '{"formato_calidad": "HD"}')
    RETURNING id INTO r_id;
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'parent');

    -- ==========================================================
    -- TABLA 4: Anime, Manga, Novelas Gráficas
    -- ==========================================================

    INSERT INTO resources (created_by, title, description, type, worldview, avg_rating, author_or_creator, focus_theme, availability, metadata)
    VALUES (admin_id, 'Clannad After Story', 'Anime profundamente emotivo sobre la familia y la pérdida', 'series', 'universal', 4.5, NULL, 'Pérdida familiar', 'Crunchyroll', '{}')
    RETURNING id INTO r_id;
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'partner');
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'child');

    INSERT INTO resources (created_by, title, description, type, worldview, avg_rating, author_or_creator, focus_theme, availability, metadata)
    VALUES (admin_id, 'Violet Evergarden', 'Anime sobre comprender el dolor, el luto y el significado del amor', 'series', 'universal', 4.3, NULL, 'Duelo y redención', 'Netflix', '{}')
    RETURNING id INTO r_id;
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'other');

    INSERT INTO resources (created_by, title, description, type, worldview, avg_rating, author_or_creator, focus_theme, availability, metadata)
    VALUES (admin_id, 'My Broken Mariko', 'Historia cruda e intensa sobre el suicidio de una amiga de la infancia', 'manga', 'universal', 3.8, NULL, 'Suicidio de una amiga', 'Buscalibre/Digital', '{}')
    RETURNING id INTO r_id;
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'friend');

    INSERT INTO resources (created_by, title, description, type, worldview, avg_rating, author_or_creator, focus_theme, availability, metadata)
    VALUES (admin_id, 'Rosalie Lightning', 'Diario gráfico del autor sobre la muerte de su hija pequeña', 'comic', 'universal', 4.3, NULL, 'Muerte de un hijo', 'Buscalibre', '{}')
    RETURNING id INTO r_id;
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'child');

    INSERT INTO resources (created_by, title, description, type, worldview, avg_rating, author_or_creator, focus_theme, availability, metadata)
    VALUES (admin_id, 'Dancing at the Pity Party', 'Memorias gráficas honestas y con humor sobre perder a una madre joven', 'comic', 'universal', 4.4, NULL, 'Pérdida de la madre', 'Buscalibre', '{}')
    RETURNING id INTO r_id;
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'parent');

    -- ==========================================================
    -- TABLA 5: Recursos Espirituales
    -- ==========================================================

    INSERT INTO resources (created_by, title, description, type, worldview, avg_rating, author_or_creator, focus_theme, availability, metadata)
    VALUES (admin_id, 'Una pena en observación', 'Clásico sobre la crisis de fe ante la pérdida de una esposa', 'book', 'christian', 4.8, 'C.S. Lewis', 'Crisis de fe y sanación', NULL, '{"tradicion": "Católica"}')
    RETURNING id INTO r_id;
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'partner');

    INSERT INTO resources (created_by, title, description, type, worldview, avg_rating, author_or_creator, focus_theme, availability, metadata)
    VALUES (admin_id, 'For Those Left Behind', 'Perspectiva islámica sobre la paciencia tras la muerte de un ser querido', 'book', 'muslim', 4.6, 'Omar Suleiman', 'Paciencia y vida futura', NULL, '{"tradicion": "Islámica"}')
    RETURNING id INTO r_id;
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'general');

    INSERT INTO resources (created_by, title, description, type, worldview, avg_rating, author_or_creator, focus_theme, availability, metadata)
    VALUES (admin_id, 'Aprendiendo a decir adiós', 'El valor de los rituales y la memoria en el duelo judío', 'book', 'jewish', 4.5, 'Marcelo Rittner', 'Ritual y memoria', NULL, '{"tradicion": "Judía"}')
    RETURNING id INTO r_id;
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'general');

    INSERT INTO resources (created_by, title, description, type, worldview, avg_rating, author_or_creator, focus_theme, availability, metadata)
    VALUES (admin_id, 'Cuando todo se derrumba', 'Impermanencia y aceptación desde la visión budista', 'book', 'buddhist', 4.7, 'Pema Chödrön', 'Impermanencia', NULL, '{"tradicion": "Budista"}')
    RETURNING id INTO r_id;
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'general');

    INSERT INTO resources (created_by, title, description, type, worldview, avg_rating, author_or_creator, focus_theme, availability, metadata)
    VALUES (admin_id, 'El jardín de los rectos', 'Tratado clásico sufí sobre la purificación del corazón ante la adversidad', 'book', 'muslim', 4.6, 'Al-Ghazali', 'Purificación del corazón', NULL, '{"tradicion": "Sufí"}')
    RETURNING id INTO r_id;
    INSERT INTO resource_loss_types (resource_id, loss_type) VALUES (r_id, 'general');

END $$;
