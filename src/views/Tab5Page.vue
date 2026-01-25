<template>
    <ion-page>
        <ion-content :fullscreen="true">
            <div class="auth-container">
                <div class="auth-card">
                    <!-- Header -->
                    <div class="auth-header">
                        <div class="brand-logo">💪</div>
                        <h2>{{ isLogin ? 'Bienvenido de nuevo' : 'Únete a Forgy' }}</h2>
                        <p class="subtitle">
                            {{ isLogin ? 'Ingresa tus datos para continuar' : 'Crea tu cuenta y empieza a entrenar' }}
                        </p>
                    </div>

                    <!-- Toggle Switch -->
                    <div class="auth-toggle-container">
                        <div class="auth-toggle">
                            <div 
                                class="toggle-bg" 
                                :style="{ transform: isLogin ? 'translateX(0)' : 'translateX(100%)' }"
                            ></div>
                            <button 
                                class="toggle-btn" 
                                :class="{ active: isLogin }" 
                                @click="isLogin = true"
                            >Ingresar</button>
                            <button 
                                class="toggle-btn" 
                                :class="{ active: !isLogin }" 
                                @click="isLogin = false"
                            >Registrarse</button>
                        </div>
                    </div>

                    <!-- Form -->
                    <form @submit.prevent="handleSubmit" class="auth-form">
                        
                        <!-- Name Field (Register only) -->
                        <div v-if="!isLogin" class="input-wrapper fade-in">
                            <ion-item lines="none" class="custom-input">
                                <ion-icon :icon="personOutline" slot="start"></ion-icon>
                                <ion-input 
                                    v-model="name" 
                                    placeholder="Nombre completo" 
                                    type="text"
                                    required
                                ></ion-input>
                            </ion-item>
                        </div>

                        <!-- Email Field -->
                        <div class="input-wrapper">
                            <ion-item lines="none" class="custom-input">
                                <ion-icon :icon="mailOutline" slot="start"></ion-icon>
                                <ion-input 
                                    v-model="email" 
                                    placeholder="Correo electrónico" 
                                    type="email"
                                    required
                                ></ion-input>
                            </ion-item>
                        </div>

                        <!-- Password Field -->
                        <div class="input-wrapper">
                            <ion-item lines="none" class="custom-input">
                                <ion-icon :icon="lockClosedOutline" slot="start"></ion-icon>
                                <ion-input 
                                    v-model="password" 
                                    placeholder="Contraseña" 
                                    type="password"
                                    required
                                ></ion-input>
                            </ion-item>
                        </div>

                        <!-- Confirm Password (Register only) -->
                        <div v-if="!isLogin" class="input-wrapper fade-in">
                            <ion-item lines="none" class="custom-input">
                                <ion-icon :icon="lockClosedOutline" slot="start"></ion-icon>
                                <ion-input 
                                    v-model="confirmPassword" 
                                    placeholder="Confirmar contraseña" 
                                    type="password"
                                    required
                                ></ion-input>
                            </ion-item>
                        </div>

                        <!-- Forgot Password Link -->
                        <div v-if="isLogin" class="forgot-password">
                            <span @click="forgotPassword">¿Olvidaste tu contraseña?</span>
                        </div>

                        <!-- Submit Button -->
                        <ion-button 
                            expand="block" 
                            type="submit" 
                            class="submit-btn"
                            :disabled="loading"
                        >
                            <ion-spinner v-if="loading" name="crescent"></ion-spinner>
                            <span v-else>{{ isLogin ? 'Iniciar Sesión' : 'Crear Cuenta' }}</span>
                        </ion-button>

                    </form>
                </div>
            </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import { 
    IonPage, IonContent, IonItem, IonInput, IonButton, IonIcon, IonSpinner,
    toastController, useIonRouter
} from '@ionic/vue';
import { ref, onMounted } from 'vue';
import { personOutline, mailOutline, lockClosedOutline } from 'ionicons/icons';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const isLogin = ref(true);
const loading = ref(false);

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');

const router = useIonRouter();

onMounted(() => {
    // Si ya hay sesión iniciada, redirigir al Home
    const session = localStorage.getItem('forgy_token');
    if (session) {
        router.replace('/tabs/home');
    }
});

/**
 * Registrar nuevo usuario
 */
async function register() {
    // Validaciones
    if (!name.value || !email.value || !password.value) {
        await showToast('Por favor completa todos los campos', 'warning');
        return;
    }

    if (password.value.length < 6) {
        await showToast('La contraseña debe tener al menos 6 caracteres', 'warning');
        return;
    }

    if (password.value !== confirmPassword.value) {
        await showToast('Las contraseñas no coinciden', 'warning');
        return;
    }

    loading.value = true;

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email.value.trim(),
                password: password.value,
                name: name.value.trim(),
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al registrar usuario');
        }

        // Guardar sesión
        saveSession(data);
        
        await showToast('¡Cuenta creada exitosamente! Bienvenido a Forgy 💪', 'success');
        
        // Redirigir al home
        setTimeout(() => {
            router.replace('/tabs/home');
        }, 500);

    } catch (error: any) {
        console.error('Error en registro:', error);
        await showToast(error.message || 'Error al crear la cuenta', 'danger');
    } finally {
        loading.value = false;
    }
}

/**
 * Iniciar sesión
 */
async function login() {
    // Validaciones
    if (!email.value || !password.value) {
        await showToast('Por favor ingresa tu email y contraseña', 'warning');
        return;
    }

    loading.value = true;

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email.value.trim(),
                password: password.value,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al iniciar sesión');
        }

        // Guardar sesión
        saveSession(data);
        
        await showToast(`¡Bienvenido de nuevo, ${data.user.name}! 💪`, 'success');
        
        // Redirigir al home
        setTimeout(() => {
            router.replace('/tabs/home');
        }, 500);

    } catch (error: any) {
        console.error('Error en login:', error);
        await showToast(error.message || 'Error al iniciar sesión', 'danger');
    } finally {
        loading.value = false;
    }
}

/**
 * Guardar sesión en localStorage
 */
function saveSession(data: any) {
    localStorage.setItem('forgy_token', data.token);
    localStorage.setItem('forgy_user', JSON.stringify(data.user));
    localStorage.setItem('forgy_token_data', JSON.stringify(data.tokenData));
}

/**
 * Manejar envío del formulario
 */
async function handleSubmit() {
    if (isLogin.value) {
        await login();
    } else {
        await register();
    }
}

/**
 * Recuperar contraseña
 */
async function forgotPassword() {
    await showToast('Funcionalidad de recuperación pendiente', 'medium');
}

/**
 * Mostrar toast
 */
async function showToast(message: string, color: 'primary' | 'success' | 'warning' | 'danger' | 'medium' = 'primary') {
    const toast = await toastController.create({
        message,
        duration: 3000,
        color,
        position: 'bottom'
    });
    await toast.present();
}
</script>
<style scoped>
/* Contenedor */
.auth-container {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  /* Usamos tu primary + secondary */
  background: linear-gradient(
    135deg,
    var(--ion-color-primary) 0%,
    var(--ion-color-secondary) 100%
  );

  padding: 20px;
}

/* Tarjeta */
.auth-card {
  background: white;
  width: 100%;
  max-width: 360px;
  border-radius: 24px;
  padding: 32px 24px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

/* Header */
.auth-header {
  text-align: center;
  margin-bottom: 24px;
}

.brand-logo {
  font-size: 48px;
  margin-bottom: 12px;
  display: inline-block;

  /* pequeño toque con tus colores */
  filter: drop-shadow(0 6px 14px rgba(var(--ion-color-primary-rgb), 0.35));
}

.auth-header h2 {
  margin: 0 0 8px;
  color: var(--ion-color-dark);
  font-weight: 800;
  font-size: 24px;
}

.subtitle {
  margin: 0;
  color: var(--ion-color-medium);
  font-size: 14px;
}

/* Toggle Switch */
.auth-toggle-container {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.auth-toggle {
  /* más coherente con la paleta */
  background: rgba(255, 255, 255, 0.65);
  border-radius: 12px;
  padding: 4px;
  display: flex;
  position: relative;
  width: 100%;

  /* borde suave con primary */
  box-shadow: 0 6px 18px rgba(var(--ion-color-primary-rgb), 0.15);
}

.toggle-bg {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);

  /* Fondo del “selector” con tu gradiente */
  background: linear-gradient(
    135deg,
    var(--ion-color-primary),
    var(--ion-color-secondary)
  );

  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.12);
  transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.toggle-btn {
  flex: 1;
  background: none;
  border: none;
  padding: 10px;
  z-index: 1;
  font-weight: 700;
  font-size: 14px;

  /* Por defecto más sobrio */
  color: rgba(0, 0, 0, 0.55);

  transition: color 0.25s ease;
  cursor: pointer;
  outline: none;
}

.toggle-btn.active {
  /* Cuando está “activo”, va encima del gradiente, por eso blanco */
  color: #ffffff;
}

/* Form */
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Inputs wrapper - antes estaba azul fijo (#185592) */
.input-wrapper {
  border-radius: 12px;
  transition: all 0.25s ease;

  /* un fondo suave cálido */
  background: rgba(var(--ion-color-primary-rgb), 0.10);
  border: 1px solid rgba(var(--ion-color-primary-rgb), 0.18);
}

.input-wrapper:focus-within {
  /* antes estaba rojo fijo */
  background: rgba(var(--ion-color-primary-rgb), 0.16);
  border-color: rgba(var(--ion-color-primary-rgb), 0.45);
  box-shadow: 0 0 0 3px rgba(var(--ion-color-primary-rgb), 0.22);
}

/* Ion item */
.custom-input {
  --background: transparent;
  --padding-start: 8px;
  --inner-padding-end: 8px;

  /* mejora visual del item */
  --border-radius: 12px;
}

/* Iconos */
.custom-input ion-icon {
  color: rgba(var(--ion-color-primary-rgb), 0.85);
  margin-right: 8px;
}

/* Input texto (importante en iOS/Android) */
.custom-input ion-input {
  --placeholder-color: rgba(0, 0, 0, 0.45);
  --color: #111;
}

/* Forgot Password */
.forgot-password {
  text-align: right;
}

.forgot-password span {
  color: var(--ion-color-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

/* Botón submit (usa primary por defecto, pero lo reforzamos) */
.submit-btn {
  margin-top: 8px;
  --border-radius: 12px;
  font-weight: 800;
  height: 48px;

  /* Gradiente con tu paleta */
  --background: linear-gradient(
    135deg,
    var(--ion-color-primary),
    var(--ion-color-secondary)
  );

  --box-shadow: 0 10px 22px rgba(var(--ion-color-primary-rgb), 0.30);
}

/* Animación */
.fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
