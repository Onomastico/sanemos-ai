# Especificaciones del Proyecto: Sanemos AI

## 1. Descripción General

**Sanemos AI** (`sanemos-ai`) es una plataforma web bilingüe (Inglés y Español) diseñada para ofrecer apoyo emocional y acompañamiento a personas en proceso de duelo. La idea principal es que un usuario pueda hablar con gente que esté pasando por pérdidas similares a la suya. En el caso de que no hayan personas reales conectadas, tiene la posibilidad de utilizar Inteligencia Artificial para proveer asistencia personalizada a través de diferentes agentes, además de conectar a los usuarios con recursos y profesionales (terapeutas).

La plataforma es completamente gratuita para los usuarios y opera bajo términos legales sujetos a la legislación chilena (Ley N° 19.628). La edad mínima de registro es de 16 años.

---

## 2. Tecnologías Principales (Tech Stack)

| Categoría | Tecnología |
|---|---|
| Frontend / Fullstack | Next.js (App Router) + React 19 |
| Base de datos y Auth | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) |
| Realtime | Supabase Realtime (Presence + postgres_changes) |
| i18n | `next-intl` (ES / EN) |
| Estilos | CSS Modules + variables globales (`globals.css`) |
| Pagos / Donaciones | Ko-fi (PayPal) + Mercado Pago |
| IA | Configurable via admin: Google Gemini / OpenAI / Anthropic |

---

## 3. Arquitectura y Estructura del Proyecto

```
src/
├── app/
│   ├── [locale]/           # Páginas i18n
│   │   ├── page.js         # Landing
│   │   ├── dashboard/      # Panel personal
│   │   ├── chat/           # Chat con IA y personas reales
│   │   ├── companions/     # Galería de compañeros IA
│   │   ├── resources/      # Directorio de recursos
│   │   ├── therapists/     # Directorio de terapeutas
│   │   ├── profile/        # Perfil propio y público
│   │   ├── admin/          # Panel de administración
│   │   ├── auth/           # Login, registro, verificación
│   │   ├── rules/          # Normas de la comunidad
│   │   ├── terms/          # Términos y condiciones
│   │   ├── donate/         # Página de donaciones
│   │   └── crisis/         # Líneas de emergencia por país
│   └── api/                # API Routes (Next.js)
│       ├── chat/           # Mensajes, conversaciones, búsqueda
│       ├── resources/      # Recursos y reseñas
│       ├── therapists/     # Terapeutas y reseñas
│       ├── profile/        # Avatar
│       ├── stats/          # Estadísticas públicas
│       └── admin/          # Usuarios, strikes, settings
├── components/
│   ├── chat/               # CommunityOnline, IncomingRequests, AgentCard
│   └── layout/             # Navbar, Footer
├── hooks/
│   └── usePresence.js      # Presencia en tiempo real
├── lib/
│   ├── supabase/           # client.js, server.js, admin.js, auth.js
│   ├── ai/agents.js        # Definición de los 5 agentes IA
│   └── moderation/         # Sistema de moderación con IA
└── messages/
    ├── es.json             # Traducciones en español
    └── en.json             # Traducciones en inglés
```

---

## 4. Funcionalidades Principales

### 4.1. Sistema de Chat y Comunicación (Pilar Principal)

El núcleo de la plataforma es conectar a las personas en duelo:

**Chat con Personas Reales**
- Salas públicas temáticas con nombre personalizado
- Chat privado 1-a-1 mediante solicitud de conversación
- Indicador de usuarios en línea en tiempo real (Supabase Presence)
- Panel de participantes actualizado en tiempo real
- Solicitudes de chat entrantes con aceptar / rechazar

**Compañeros IA**
Cuando no hay personas reales disponibles o el usuario prefiere privacidad, puede hablar con 5 agentes especializados:

| Agente | Rol |
|---|---|
| Luna 🫂 | Escucha Empática |
| Marco 🧭 | Guía de Duelo y psicoeducación |
| Serena 🧘 | Mindfulness y Grounding |
| Alma 📖 | Historias y Significado poético |
| Faro 🚨 | Soporte en Crisis y prevención |

**Visibilidad de conversaciones**
- Privado (solo el usuario)
- Público (cualquiera puede buscar y leer)
- Compartido (usuarios específicos por ID)
- Etiquetas de tipo de pérdida y cosmovisión

**Búsqueda de conversaciones**
- Búsqueda de texto libre en el historial propio
- Lectura de conversaciones públicas de otros usuarios

---

### 4.2. Directorio de Recursos

Recursos curados y enviados por la comunidad, filtrables por:
- **Tipo**: Libro, Serie, Película, Cómic, Manga, Canción, Libro en línea, Post/URL, Otro
- **Tipo de pérdida**: Padre/Madre, Hijo/a, Pareja, Hermano/a, Amigo/a, Mascota, Duelo general, Otro
- **Cosmovisión**: Secular, Espiritual, Cristiano, Judío, Musulmán, Budista, Hindú, Universal

**Flujo de recursos**
1. Usuario envía recurso → estado `pendiente`
2. Moderador (admin) aprueba o rechaza con razón
3. Recurso aprobado visible para toda la comunidad
4. Usuarios pueden escribir reseñas (también moderadas)
5. Sistema de likes / dislikes por recurso

---

### 4.3. Directorio de Terapeutas

Listado de profesionales de salud mental especializados en duelo:
- Búsqueda por nombre, ciudad o especialidad
- Filtro por modalidad: Presencial, En línea, Ambas
- Filtro por especialización (duelo, trauma, EMDR, TCC, etc.)
- Reseñas de usuarios (opción de publicar de forma anónima)
- Perfil completo: bio, credenciales, idiomas, contacto, LinkedIn
- Flag de verificado (asignado por admins)
- Terapeutas pueden registrar su propio perfil (`/therapists/new`)

> **Nota**: Sanemos AI no verifica ni avala las credenciales de los profesionales. El directorio es informativo.

---

### 4.4. Perfiles de Usuario

- Avatar personalizado (hasta 2 MB, JPEG/PNG/WebP/GIF)
- Nombre para mostrar y apodo opcionales
- Historial de pérdidas (tipo, descripción, fecha, estado activo/resuelto)
- Configuración de perfil público / privado
- Cosmovisión preferida
- Vista de perfil público accesible por otros usuarios

---

### 4.5. Sistema de Presencia en Tiempo Real

- Indicador de personas en línea visible en el chat y la comunidad
- Implementado con Supabase Realtime Presence
- `PresenceProvider` como contexto global para evitar múltiples canales
- Nombre de usuario y email como fallback cuando no hay display_name

---

### 4.6. Panel de Administración

Panel protegido accesible solo para usuarios con rol admin:

| Sección | Funciones |
|---|---|
| **Recursos** | Ver pendientes, aprobar, rechazar con razón |
| **Terapeutas** | Crear, editar, marcar como verificado, eliminar |
| **Reseñas** | Moderar reseñas de recursos y terapeutas |
| **Usuarios** | Ver lista, asignar strikes, suspender cuentas |
| **Configuración** | Seleccionar proveedor de IA activo (Gemini / OpenAI / Anthropic) |

---

### 4.7. Moderación de Contenido con IA

Sistema automático de moderación que analiza contenido antes de publicarlo:
- Análisis de mensajes de chat con modelos de lenguaje
- Análisis de recursos y reseñas enviadas por usuarios
- Análisis de perfiles de terapeutas nuevos
- Sistema de strikes: advertencia → strike → suspensión temporal → ban permanente
- Mensajes bloqueados notificados al usuario con contador de strikes
- Migraciones: `019_ai_moderation.sql`, `020_chat_moderation.sql`, `021_therapist_moderation.sql`

---

### 4.8. Autenticación y Registro

- Registro con email y contraseña (Supabase Auth)
- Verificación de email obligatoria antes del primer acceso
- Aceptación obligatoria de Términos y Condiciones + Normas de la Comunidad al registrarse
- Declaración de edad mínima de 16 años en el formulario de registro
- Callback de autenticación via `/auth/callback`

---

### 4.9. Páginas Legales y de Comunidad

| Página | Ruta | Descripción |
|---|---|---|
| Normas de la Comunidad | `/rules` | 10 normas detalladas de comportamiento |
| Términos y Condiciones | `/terms` | 14 secciones, jurisdicción chilena (Ley 19.628) |
| Líneas de Crisis | `/crisis` | Líneas de emergencia de 20+ países de América y España |

Todas las páginas están disponibles en español e inglés.

---

### 4.10. Donaciones

Página `/donate` con opciones de apoyo voluntario para sostener la plataforma:
- **Ko-fi**: Donaciones únicas o mensuales con PayPal / tarjeta internacional → `ko-fi.com/sanemosai`
- **Mercado Pago**: Donaciones desde Chile → `link.mercadopago.cl/sanemosai`
- Sección de "¿Por qué donar?" con desglose de costos operativos
- FAQ sobre deducibilidad, recurrencia y uso de fondos

---

### 4.11. Footer y Navegación Global

El footer incluye:
- Links de proyecto: Normas de la Comunidad, Términos y Condiciones
- Links de soporte: Donar, Contacto (`contacto@sanemos.ai`)
- Banner de crisis con link directo a `/crisis`
- Redes sociales: Instagram, TikTok, Facebook, Twitter/X, YouTube
- Copyright con año dinámico

---

## 5. Integración con Base de Datos (Supabase)

Toda la persistencia de datos se maneja a través de Supabase:

| Módulo | Archivo |
|---|---|
| Cliente (browser) | `src/lib/supabase/client.js` |
| Servidor (SSR) | `src/lib/supabase/server.js` |
| Admin (service role) | `src/lib/supabase/admin.js` |
| Auth helpers | `src/lib/supabase/auth.js` |

**Tablas principales**: usuarios, perfiles, conversaciones, mensajes, participantes, recursos, reseñas de recursos, terapeutas, reseñas de terapeutas, historial de pérdidas, strikes, configuración global.

**Realtime**: canales de Presence para usuarios en línea y `postgres_changes` para mensajes y participantes de chat.

> **Patrón crítico**: El cliente Supabase siempre se crea **dentro** del `useEffect`, nunca fuera, para evitar loops infinitos de reconexión en componentes con realtime.

---

## 6. Internacionalización

- Idiomas soportados: **Español (es)** e **Inglés (en)**
- Implementado con `next-intl`
- Archivos de traducción en `src/messages/`
- Las páginas legales (terms, rules, crisis, donate) usan contenido inline bilingüe dado el volumen de texto

---

## 7. Consideraciones Legales y de Seguridad

- **Jurisdicción**: República de Chile — Ley N° 19.628 (Protección de Datos)
- **Edad mínima**: 16 años (con conocimiento del representante legal para 16-17 años)
- **Disclaimer IA**: Los compañeros de IA no son profesionales de salud mental ni reemplazan atención clínica
- **Disclaimer terapeutas**: Sanemos AI no verifica credenciales ni avala a los profesionales del directorio
- **Emergencias**: La plataforma no es un servicio de emergencias; se redirige a líneas oficiales por país
- **Datos**: No se venden datos a terceros; datos de conversación usados solo para continuidad del servicio
