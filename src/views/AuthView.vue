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
                                @click="switchToLogin"
                            >Ingresar</button>
                            <button
                                class="toggle-btn"
                                :class="{ active: !isLogin }"
                                @click="switchToRegister"
                            >Registrarse</button>
                        </div>
                    </div>

                    <!-- Form -->
                    <form
                        @submit.prevent="handleSubmit"
                        class="auth-form"
                    >

                        <!-- Name Field (Register only) -->
                        <div
                            v-if="!isLogin"
                            class="input-wrapper fade-in"
                        >
                            <ion-item
                                lines="none"
                                class="custom-input"
                            >
                                <ion-icon
                                    :icon="personOutline"
                                    slot="start"
                                ></ion-icon>
                                <ion-input
                                    v-model="name"
                                    placeholder="Nombre completo"
                                    type="text"
                                    required
                                    @ionBlur="validateName"
                                ></ion-input>
                            </ion-item>
                            <div
                                v-if="errors.name"
                                class="error-message"
                            >{{ errors.name }}</div>
                        </div>

                        <!-- Email Field -->
                        <div class="input-wrapper">
                            <ion-item
                                lines="none"
                                class="custom-input"
                            >
                                <ion-icon
                                    :icon="mailOutline"
                                    slot="start"
                                ></ion-icon>
                                <ion-input
                                    v-model="email"
                                    placeholder="Correo electrónico"
                                    type="email"
                                    required
                                    @ionBlur="validateEmail"
                                ></ion-input>
                            </ion-item>
                            <div
                                v-if="errors.email"
                                class="error-message"
                            >{{ errors.email }}</div>
                        </div>

                        <!-- Password Field -->
                        <div class="input-wrapper">
                            <ion-item
                                lines="none"
                                class="custom-input"
                            >
                                <ion-icon
                                    :icon="lockClosedOutline"
                                    slot="start"
                                ></ion-icon>
                                <ion-input
                                    v-model="password"
                                    :placeholder="isLogin ? 'Contraseña' : 'Contraseña (min. 8 caracteres)'"
                                    :type="showPassword ? 'text' : 'password'"
                                    required
                                    @ionBlur="validatePassword"
                                ></ion-input>
                                <ion-icon
                                    slot="end"
                                    :icon="showPassword ? eyeOffOutline : eyeOutline"
                                    @click="togglePasswordVisibility"
                                    class="eye-icon"
                                ></ion-icon>
                            </ion-item>
                            <div
                                v-if="errors.password"
                                class="error-message"
                            >{{ errors.password }}</div>

                            <!-- Password strength indicator (Register only) -->
                            <div
                                v-if="!isLogin && password"
                                class="password-strength"
                            >
                                <div class="strength-bar">
                                    <div
                                        class="strength-fill"
                                        :class="passwordStrength.class"
                                        :style="{ width: passwordStrength.width }"
                                    ></div>
                                </div>
                                <p
                                    class="strength-text"
                                    :class="passwordStrength.class"
                                >
                                    {{ passwordStrength.text }}
                                </p>
                            </div>

                            <!-- Password requirements (Register only) - Improved -->
                            <div
                                v-if="!isLogin && password && unmetPasswordRequirements.length > 0"
                                class="password-requirements fade-in"
                            >
                                <p class="requirements-title">Para que sea segura, tu contraseña debe tener:</p>
                                <transition-group
                                    name="list"
                                    tag="div"
                                >
                                    <div
                                        v-for="req in unmetPasswordRequirements"
                                        :key="req.key"
                                        class="requirement"
                                    >
                                        <ion-icon
                                            :icon="closeCircle"
                                            color="danger"
                                        ></ion-icon>
                                        <span>{{ req.text }}</span>
                                    </div>
                                </transition-group>
                            </div>
                        </div>

                        <!-- Confirm Password (Register only) -->
                        <div
                            v-if="!isLogin"
                            class="input-wrapper fade-in"
                        >
                            <ion-item
                                lines="none"
                                class="custom-input"
                            >
                                <ion-icon
                                    :icon="lockClosedOutline"
                                    slot="start"
                                ></ion-icon>
                                <ion-input
                                    v-model="confirmPassword"
                                    placeholder="Confirmar contraseña"
                                    :type="showConfirmPassword ? 'text' : 'password'"
                                    required
                                    @ionBlur="validateConfirmPassword"
                                ></ion-input>
                                <ion-icon
                                    slot="end"
                                    :icon="showConfirmPassword ? eyeOffOutline : eyeOutline"
                                    @click="toggleConfirmPasswordVisibility"
                                    class="eye-icon"
                                ></ion-icon>
                            </ion-item>
                            <div
                                v-if="errors.confirmPassword"
                                class="error-message"
                            >{{ errors.confirmPassword }}</div>
                        </div>

                        <!-- Forgot Password Link -->
                        <div
                            v-if="isLogin"
                            class="forgot-password"
                        >
                            <span @click="forgotPassword">¿Olvidaste tu contraseña?</span>
                        </div>

                        <!-- Submit Button -->
                        <ion-button
                            expand="block"
                            type="submit"
                            class="submit-btn"
                            :disabled="loading || (!isLogin && !isPasswordValid)"
                        >
                            <ion-spinner
                                v-if="loading"
                                name="crescent"
                            ></ion-spinner>
                            <span v-else>{{ isLogin ? 'Iniciar Sesión' : 'Crear Cuenta' }}</span>
                        </ion-button>

                    </form> <!-- Cierra auth-form -->
                </div>
            </div> <!-- Cierra auth-card -->
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
import {
    IonPage, IonContent, IonItem, IonInput, IonButton, IonIcon, IonSpinner,
    toastController, useIonRouter, alertController
} from '@ionic/vue';
import { ref, onMounted, computed, reactive } from 'vue';
import {
    personOutline, mailOutline, lockClosedOutline,
    eyeOutline, eyeOffOutline, checkmarkCircle, closeCircle
} from 'ionicons/icons';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const isLogin = ref(true);
const loading = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');

const errors = reactive({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
});

const router = useIonRouter();

onMounted(() => {
    checkExistingSession();
});

/**
 * Verificar si ya hay sesión activa
 */
async function checkExistingSession() {
    const token = localStorage.getItem('token');
    const tokenData = localStorage.getItem('token_data');

    if (token && tokenData) {
        const data = JSON.parse(tokenData);
        const now = new Date();
        const until = new Date(data.until);

        // Si el token no ha expirado, redirigir
        if (now <= until) {
            router.replace('/tabs/home');
        } else {
            // Token expirado, limpiar
            clearSession();
        }
    }
}

/**
 * Verificaciones de contraseña
 */
const passwordChecks = computed(() => ({
    length: password.value.length >= 8,
    uppercase: /[A-Z]/.test(password.value),
    lowercase: /[a-z]/.test(password.value),
    number: /[0-9]/.test(password.value),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password.value)
}));

/**
 * Lista de requerimientos de contraseña no cumplidos
 */
const allPasswordRequirements = [
    { key: 'length', text: 'Mínimo 8 caracteres' },
    { key: 'uppercase', text: 'Una letra mayúscula (A-Z)' },
    { key: 'lowercase', text: 'Una letra minúscula (a-z)' },
    { key: 'number', text: 'Al menos un número (0-9)' },
    { key: 'special', text: 'Al menos un símbolo (!@#$%)' }
];

const unmetPasswordRequirements = computed(() => {
    return allPasswordRequirements.filter(req => !passwordChecks.value[req.key as keyof typeof passwordChecks.value]);
});

/**
 * Validez completa de la contraseña
 */
const isPasswordValid = computed(() => {
    if (isLogin.value) return true;
    return Object.values(passwordChecks.value).every(check => check);
});

/**
 * Fuerza de la contraseña
 */
const passwordStrength = computed(() => {
    const checks = Object.values(passwordChecks.value).filter(Boolean).length;

    if (checks === 0) {
        return { text: '', width: '0%', class: '' };
    } else if (checks <= 2) {
        return { text: 'Débil', width: '33%', class: 'weak' };
    } else if (checks <= 4) {
        return { text: 'Media', width: '66%', class: 'medium' };
    } else {
        return { text: 'Fuerte', width: '100%', class: 'strong' };
    }
});

/**
 * Validaciones individuales
 */
function validateName() {
    if (!isLogin.value && name.value.trim().length < 2) {
        errors.name = 'El nombre debe tener al menos 2 caracteres';
        return false;
    }
    errors.name = '';
    return true;
}

function validateEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
        errors.email = 'Por favor ingresa un email válido';
        return false;
    }
    errors.email = '';
    return true;
}

function validatePassword() {
    if (isLogin.value) {
        if (password.value.length === 0) {
            errors.password = 'La contraseña es requerida';
            return false;
        }
    } else {
        if (!isPasswordValid.value) {
            errors.password = 'La contraseña no cumple con los requisitos de seguridad';
            return false;
        }
    }
    errors.password = '';
    return true;
}

function validateConfirmPassword() {
    if (!isLogin.value && password.value !== confirmPassword.value) {
        errors.confirmPassword = 'Las contraseñas no coinciden';
        return false;
    }
    errors.confirmPassword = '';
    return true;
}

/**
 * Validar todo el formulario
 */
function validateForm(): boolean {
    let isValid = true;

    if (!isLogin.value) {
        isValid = validateName() && isValid;
    }

    isValid = validateEmail() && isValid;
    isValid = validatePassword() && isValid;

    if (!isLogin.value) {
        isValid = validateConfirmPassword() && isValid;
    }

    return isValid;
}

/**
 * Cambiar entre login y registro
 */
function switchToLogin() {
    isLogin.value = true;
    clearErrors();
}

function switchToRegister() {
    isLogin.value = false;
    clearErrors();
}

function clearErrors() {
    errors.name = '';
    errors.email = '';
    errors.password = '';
    errors.confirmPassword = '';
}

/**
 * Toggle visibilidad de contraseña
 */
function togglePasswordVisibility() {
    showPassword.value = !showPassword.value;
}

function toggleConfirmPasswordVisibility() {
    showConfirmPassword.value = !showConfirmPassword.value;
}

/**
 * Registrar nuevo usuario
 */
async function register() {
    if (!validateForm()) {
        await showToast('Por favor corrige los errores en el formulario', 'warning');
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
                email: email.value.trim().toLowerCase(),
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

        // Mostrar bienvenida
        await showWelcomeAlert(data.user.name);

        // Redirigir al home
        router.replace('/tabs/home');

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
    if (!validateForm()) {
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
                email: email.value.trim().toLowerCase(),
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
        await showToast(error.message || 'Credenciales inválidas', 'danger');
    } finally {
        loading.value = false;
    }
}

/**
 * Guardar sesión en localStorage
 */
function saveSession(data: any) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token_data', JSON.stringify(data.tokenData));
}

/**
 * Limpiar sesión
 */
function clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('token_data');
}

/**
 * Mostrar alerta de bienvenida para nuevos usuarios
 */
async function showWelcomeAlert(userName: string) {
    const alert = await alertController.create({
        header: '¡Bienvenido a Forgy! 💪',
        message: `Hola ${userName}, tu cuenta ha sido creada exitosamente. ¡Comienza tu viaje fitness ahora!`,
        buttons: ['¡Empecemos!']
    });
    await alert.present();
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
    const alert = await alertController.create({
        header: 'Recuperar Contraseña',
        message: 'Esta funcionalidad estará disponible próximamente.',
        buttons: ['OK']
    });
    await alert.present();
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
    background: linear-gradient(135deg,
            var(--ion-color-primary) 0%,
            var(--ion-color-secondary) 100%);

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
    background: linear-gradient(135deg,
            var(--ion-color-primary),
            var(--ion-color-secondary));

    border-radius: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
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
    --background: linear-gradient(135deg,
            var(--ion-color-primary),
            var(--ion-color-secondary));

    --box-shadow: 0 10px 22px rgba(var(--ion-color-primary-rgb), 0.30);
}

/* Animación */
.fade-in {
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Password Strength & Requirements */
.password-strength {
    margin-top: 12px;
    padding: 0 4px;
}

.strength-bar {
    height: 6px;
    background: var(--ion-color-step-150, #e0e0e0);
    border-radius: 3px;
    overflow: hidden;
}

.strength-fill {
    height: 100%;
    transition: width 0.3s ease, background-color 0.3s ease;
}

.strength-text {
    margin: 4px 0 0;
    font-size: 12px;
    font-weight: 600;
    text-align: right;
    transition: color 0.3s ease;
}

.strength-fill.weak {
    background-color: var(--ion-color-danger);
}

.strength-text.weak {
    color: var(--ion-color-danger);
}

.strength-fill.medium {
    background-color: var(--ion-color-warning);
}

.strength-text.medium {
    color: var(--ion-color-warning);
}

.strength-fill.strong {
    background-color: var(--ion-color-success);
}

.strength-text.strong {
    color: var(--ion-color-success);
}

.password-requirements {
    margin-top: 12px;
}

.requirements-title {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--ion-color-dark-shade);
}

.requirement {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: var(--ion-color-medium-shade);
    margin-bottom: 6px;
}

.requirement ion-icon {
    font-size: 16px;
    flex-shrink: 0;
}

.list-enter-active,
.list-leave-active {
    transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: translateX(20px);
}
</style>