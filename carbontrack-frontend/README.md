# CarbonTrack Frontend

React 18 + Vite + React Router 6 + Axios + Recharts, plain CSS (no Tailwind).

## Requirements
- Node.js 18 or newer (check with `node -v`)
- npm (ships with Node)

## Run it (3 steps)

1. Unzip the file and open a terminal inside the `carbontrack-frontend` folder.

       cd carbontrack-frontend

2. Install dependencies (one time):

       npm install

3. Start the dev server:

       npm run dev

   Open http://localhost:5173

That's it. By default the app runs in **demo mode**: a fake backend lives inside the browser
(data saved in localStorage), so you do NOT need Spring Boot running.

### Try it
1. Click Register and create an account.
2. Log Activity -> Transport -> Car (petrol) -> 15 km -> preview shows 2.880 kg CO2e -> submit.
3. Activities shows your entry; Dashboard shows the pie and line charts.
4. Forgot password in demo mode: the OTP is always `123456`.

## Use your real Spring Boot backend instead

1. Open `.env` and set:

       VITE_USE_MOCK=false
       VITE_API_URL=http://localhost:8080

2. Copy `backend-extras/CorsConfig.java` into
   `carbontrack-backend/src/main/java/com/carbontrack/carbontrackbackend/config/`
   and make sure SecurityConfig contains `.cors(Customizer.withDefaults())`.
3. Start the backend: `./mvnw spring-boot:run` (port 8080).
4. Restart the frontend (`Ctrl+C`, then `npm run dev`) because .env is read at startup.

Backend must return `{ token, user }` from /api/auth/login and /api/auth/register.
If yours returns different field names, edit `persist()` in `src/context/AuthContext.jsx`.

## Production build

    npm run build      # outputs dist/
    npm run preview    # serves dist/ locally

## Reset demo data
Browser DevTools -> Application -> Local Storage -> delete `ct_mock_db`, `ct_token`, `ct_user`.

## Troubleshooting
| Problem | Fix |
|---|---|
| `npm install` fails | Update Node to 18+ |
| Port 5173 busy | Vite picks the next port automatically; use the URL it prints (then add that origin to CorsConfig if using the real backend) |
| CORS error with real backend | Add CorsConfig.java and `.cors(Customizer.withDefaults())` |
| Login works but every call is 401 | Backend token field isn't named `token` |
| Changed .env but nothing changed | Restart `npm run dev` |
