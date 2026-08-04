This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Servidor MCP

El tracker expone un servidor [MCP](https://modelcontextprotocol.io) (Streamable HTTP) en `/api/mcp` para conectarlo a Claude, Cursor u otros clientes.

### Autenticación

- Los tokens se crean desde **Configuración → MCP** (requiere sesión iniciada).
- Cada token dura **30 días** y se puede **renovar manualmente por 30 días más sin cambiar su valor** (solo se extiende el vencimiento). También se puede revocar.
- En la base solo se guarda el **hash SHA-256** del token; el valor completo se muestra una única vez al crearlo.
- Medidas adicionales: máximo 5 tokens activos por usuario, rate limit de intentos fallidos de autenticación, verificación de expiración/revocación en cada request, registro de creación/renovación/revocación en el activity log y `lastUsedAt` por token. El endpoint no expone herramientas destructivas ni de gestión de usuarios, y la gestión de tokens solo es posible con sesión (nunca con el propio token MCP).

### Configuración del cliente

```json
{
  "mcpServers": {
    "thesis-tracker": {
      "type": "http",
      "url": "https://<tu-dominio>/api/mcp",
      "headers": { "Authorization": "Bearer <TU_TOKEN>" }
    }
  }
}
```

### Herramientas disponibles

Lectura: `get_project_overview`, `search`, `list_tasks`, `list_activities`, `list_research`, `list_decisions`, `list_experiments`. Escritura (actúan como el dueño del token y quedan auditadas): `create_task`, `update_task`, `create_research_entry`.

> Nota de despliegue: el modelo `McpToken` requiere sincronizar el esquema con `npm run db:push` (el proyecto no usa migraciones).

## Getting Started:

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
