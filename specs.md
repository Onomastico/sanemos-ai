# Especificaciones del Proyecto: Sanemos AI

## 1. Descripción General
**Sanemos AI** (`sanemos-ai`) es una plataforma web bilingüe (Inglés y Español) diseñada para ofrecer apoyo emocional y acompañamiento a personas en proceso de duelo. La idea principal es que un usuario pueda hablar con gente que este pasando por perdidas similares a la suya.  En el caso de que no hayan personas reales conectadas tiene la posibilidad de utilizar Inteligencia Artificial para proveer asistencia personalizada a través de diferentes agentes, además de conectar a los usuarios con recursos y profesionales (terapeutas).

## 2. Tecnologías Principales (Tech Stack)
- **Frontend / Fullstack Framework**: Next.js 16.1.6 (App Router)
- **Librería de UI**: React 19
- **Base de Datos y Autenticación**: Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- **Internacionalización (i18n)**: `next-intl` (Soporte para múltiples idiomas, principalmente `en` y `es`)
- **Estilos**: CSS Modules y estilos globales (`globals.css`)

## 3. Arquitectura y Estructura del Proyecto
El proyecto sigue la estructura del App Router de Next.js (`src/app`).
- `src/app/[locale]`: Contiene todas las páginas de la aplicación, soportando internacionalización.
- `src/app/api`: Contiene los endpoints de la API (Backend over Next.js).
- `src/components`: Componentes reutilizables de UI (chat, layout, recursos, compañeros).
- `src/lib`: Lógica de negocio, configuración de Supabase y definición de Agentes de IA.
- `src/messages`: Archivos de traducción para la internacionalización.

## 4. Funcionalidades Principales

### 4.1. Sistema de Chat y Comunicación (Pilar Principal)
El núcleo de la plataforma es conectar a las personas en duelo:
- **Chat con Personas Reales**: Opciones para interactuar en chats públicos comunitarios o solicitar conversaciones privadas 1-a-1.
- **Compañeros IA (Alternativa / Apoyo)**: Cuando no hay personas reales disponibles o el usuario prefiere no interactuar con humanos, puede hablar con una serie de 5 agentes de IA especializados, cada uno diseñado para un rol y necesidad específica:
  - **Luna (🫂)**: Escucha Empática.
  - **Marco (🧭)**: Guía de Duelo y psicoeducación.
  - **Serena (🧘)**: Mindfulness y Grounding.
  - **Alma (📖)**: Historias y Significado poético.
  - **Faro (🚨)**: Soporte en Crisis y prevención.

### 4.2. Búsqueda y Lectura de Conversaciones Compartidas
- **Lectura Pública**: Los usuarios pueden buscar y leer chats anteriores (ya sean entre personas reales o con agentes de IA) que otros usuarios hayan decidido compartir de forma pública, permitiendo aprender y encontrar consuelo en las experiencias de otros.

### 4.3. Directorio de Recursos y Profesionales
- Una funcionalidad para hallar el apoyo clínico e informativo más adecuado según el tipo de pérdida y la cosmovisión del usuario:
  - **Terapeutas**: Listado e información de contacto de profesionales de la salud mental reales.
  - **Recursos**: Material de lectura, guías y contenido curado para asistir en el proceso de duelo.

### 4.4. Gestión de Usuarios y Panel de Administración
- **Autenticación e Historial**: Registro con Supabase Auth y tablero personal (Dashboard) del usuario.
- **Administración**: Panel protegido para que los gestores de la plataforma puedan moderar recursos, terapeutas, reseñas y configuraciones globales.

## 5. Integración con Base de Datos (Supabase)
Toda la persistencia de datos (usuarios, mensajes de chat, conversaciones, recursos y terapeutas) se maneja a través de un cliente de Supabase alojado en `src/lib/supabase`, el cual separa la lógica de cliente (`client.js`), servidor (`server.js`), administrador (`admin.js`) y autenticación (`auth.js`).

