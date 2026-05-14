# Guía para montar el bot en un servidor

## Requisitos
- Node.js 18+
- Git
- Gestor de procesos (pm2 recomendado)

## Pasos

### 1. Subir a GitHub
```bash
# En tu PC local
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/tuusuario/bot-whatsapp.git
git push -u origin main
```

### 2. Conectarse al servidor
```bash
ssh usuario@ip-del-servidor
```

### 3. Clonar y preparar
```bash
git clone https://github.com/tuusuario/bot-whatsapp.git
cd bot-whatsapp
npm install
```

### 4. Instalar pm2 (mantiene el bot siempre corriendo)
```bash
npm install -g pm2
pm2 start index.js --name bot-whatsapp
pm2 save
pm2 startup   # para que inicie solo al reiniciar el servidor
```

### Comandos útiles de pm2
```bash
pm2 logs          # ver logs
pm2 restart bot-whatsapp   # reiniciar
pm2 stop bot-whatsapp      # detener
pm2 status        # ver estado
```

## Notas importantes
- `auth/` contiene la sesión de WhatsApp — **nunca subirla a GitHub** (agregar a `.gitignore`)
- Si se pierde la sesión, eliminar `auth/` y escanear QR de nuevo
- El servidor debe tener conexión a internet estable
- pm2 reinicia el bot automáticamente si se cae
