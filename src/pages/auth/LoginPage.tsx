import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Rocket } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import logoImage from '@/assets/elovni-logo.png';
import './LoginPage.css';

const schema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
});
type FormData = z.infer<typeof schema>;

type Star = {
  id: number;
  top: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
};

const StarField = () => {
  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 2.4 + 0.6,
        duration: Math.random() * 4 + 2,
        delay: Math.random() * 2.5,
      })),
    []
  );

  return (
    <div className="login-starfield" aria-hidden="true">
      {stars.map((star) => (
        <span
          key={star.id}
          className="login-star"
          style={{
            top: `${star.top}%`,
            left: `${star.left}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDuration: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
};

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async ({ email, password }: FormData) => {
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <StarField />
      <div className="login-glow" aria-hidden="true" />

      <section className="login-shell" aria-label="Ingreso al sistema ElOvni">
        <div className="login-card">
          <div className="login-card-overlay" aria-hidden="true" />

          <header className="login-header">
            <div className="login-logo-wrap">
              <img src={logoImage} alt="Logo ElOvni" className="login-logo" />
            </div>
            <h1>
              Bienvenido a <span>ElOvni</span>
            </h1>
            <p>Portal de inventario y ventas intergalactico</p>
          </header>

          <form className="login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="login-field">
              <label htmlFor="email">Identificacion (Correo)</label>
              <div className="login-input-wrap">
                <Mail size={18} aria-hidden="true" />
                <input id="email" type="email" {...register('email')} placeholder="tripulante@elovni.com" />
              </div>
              {errors.email && <p className="login-error">{errors.email.message}</p>}
            </div>

            <div className="login-field">
              <label htmlFor="password">Codigo de Acceso</label>
              <div className="login-input-wrap">
                <Lock size={18} aria-hidden="true" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="login-toggle-password"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="login-error">{errors.password.message}</p>}
            </div>

            <div className="login-row">
              <label className="login-remember" htmlFor="remember-me">
                <input id="remember-me" type="checkbox" />
                <span>Recordar nave</span>
              </label>
              <a href="/login" onClick={(event) => event.preventDefault()}>
                ¿Olvidaste tu codigo?
              </a>
            </div>

            {error && <p className="login-error login-error-block">{error}</p>}

            <button type="submit" disabled={loading} className="login-submit">
              {loading ? (
                <span className="login-spinner" aria-hidden="true" />
              ) : (
                <>
                  <Rocket size={18} aria-hidden="true" />
                  <span>Abordar Nave</span>
                </>
              )}
            </button>
          </form>

          <footer className="login-footer">Sistema de Gestion ElOvni v1.0.42</footer>
        </div>
      </section>
    </div>
  );
}
