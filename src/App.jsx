import { useEffect, useMemo, useState } from "react";

const SERVICES = [
  { value: "tuns", label: "Tuns" },
  { value: "aranjat barba", label: "Aranjat barbă" },
  { value: "pachet complet", label: "Pachet complet" },
];

const phoneRegex = /^[+]?([0-9]{8,15})$/;

function App() {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    service: "tuns",
    date: "",
    time: "",
    message: "",
    captcha_a: 0,
    captcha_b: 0,
    captcha_result: "",
  });
  const [status, setStatus] = useState({ type: "idle", message: "" });

  // Generate simple captcha (sum of two numbers)
  const regenerateCaptcha = () => {
    const a = Math.floor(Math.random() * 8) + 1; // 1..9
    const b = Math.floor(Math.random() * 8) + 1; // 1..9
    setForm((f) => ({ ...f, captcha_a: a, captcha_b: b, captcha_result: "" }));
  };

  useEffect(() => {
    regenerateCaptcha();
  }, []);

  const backendUrl = useMemo(() => {
    const base = import.meta.env.VITE_BACKEND_URL || "";
    return base.replace(/\/$/, "");
  }, []);

  const validateClient = () => {
    const errors = [];
    if (!form.full_name || form.full_name.trim().length < 2) errors.push("Numele este obligatoriu.");
    if (!form.phone || !phoneRegex.test(form.phone.replace(/\s/g, ""))) errors.push("Număr de telefon invalid.");
    if (!form.service) errors.push("Selectează serviciul.");
    if (!form.date) errors.push("Selectează data.");
    if (!form.time) errors.push("Selectează ora.");

    if (form.date && form.time) {
      const dt = new Date(`${form.date}T${form.time}:00`);
      const now = new Date();
      if (!(dt instanceof Date) || isNaN(dt.getTime()) || dt.getTime() <= now.getTime()) {
        errors.push("Data și ora nu pot fi în trecut.");
      }
    }

    if (String(Number(form.captcha_result)) !== String(form.captcha_a + form.captcha_b)) {
      errors.push("Captcha invalid.");
    }

    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "idle", message: "" });

    const errors = validateClient();
    if (errors.length) {
      setStatus({ type: "error", message: errors.join(" ") });
      return;
    }

    setStatus({ type: "loading", message: "Se trimite..." });

    try {
      const res = await fetch(`${backendUrl}/api/appointment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          phone: form.phone,
          email: form.email || null,
          service: form.service,
          date: form.date,
          time: form.time,
          message: form.message || null,
          captcha_a: form.captcha_a,
          captcha_b: form.captcha_b,
          captcha_result: Number(form.captcha_result),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.detail || data?.message || "Eroare la trimitere.";
        setStatus({ type: "error", message: msg });
        regenerateCaptcha();
        return;
      }

      setStatus({ type: "success", message: data?.message || "Programarea a fost trimisă cu succes." });
      // reset form except service
      setForm((f) => ({
        ...f,
        full_name: "",
        phone: "",
        email: "",
        date: "",
        time: "",
        message: "",
        captcha_result: "",
      }));
      regenerateCaptcha();
    } catch (err) {
      setStatus({ type: "error", message: "Eroare de rețea sau server. Încearcă din nou." });
      regenerateCaptcha();
    }
  };

  return (
    <div>
      <h1>Stk Barbershop - Programări</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nume complet</label>
          <input name="full_name" value={form.full_name} onChange={handleChange} required />
        </div>
        <div>
          <label>Număr de telefon</label>
          <input name="phone" value={form.phone} onChange={handleChange} required placeholder="ex: +40712345678" />
        </div>
        <div>
          <label>Adresă de email (opțional)</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} />
        </div>
        <div>
          <label>Serviciul dorit</label>
          <select name="service" value={form.service} onChange={handleChange} required>
            {SERVICES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Data programării</label>
          <input name="date" type="date" value={form.date} onChange={handleChange} required />
        </div>
        <div>
          <label>Ora programării</label>
          <input name="time" type="time" value={form.time} onChange={handleChange} required />
        </div>
        <div>
          <label>Mesaj (opțional)</label>
          <textarea name="message" value={form.message} onChange={handleChange} />
        </div>
        <div>
          <label>Captcha: Cât fac {form.captcha_a} + {form.captcha_b}?</label>
          <input name="captcha_result" value={form.captcha_result} onChange={handleChange} required />
          <button type="button" onClick={regenerateCaptcha}>Reîncarcă</button>
        </div>
        <div>
          <button type="submit" disabled={status.type === "loading"}>Trimite programarea</button>
        </div>
      </form>

      {status.type === "success" && <p>{status.message}</p>}
      {status.type === "error" && <p>{status.message}</p>}
      {status.type === "loading" && <p>{status.message}</p>}

      <div>
        <p>Setează adresa serverului în variabila VITE_BACKEND_URL.</p>
      </div>
    </div>
  );
}

export default App;
