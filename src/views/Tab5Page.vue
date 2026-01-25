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
                                    v-model="namee" 
                                    placeholder="Nombre completo" 
                                    type="text"
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
                                ></ion-input>
                            </ion-item>
                        </div>

                        <!-- Confirm Password (Register only) -->
                        <div v-if="!isLogin" class="input-wrapper fade-in">
                            <ion-item lines="none" class="custom-input">
                                <ion-icon :icon="lockClosedOutline" slot="start"></ion-icon>
                                <ion-input 
                                    v-model="formData.confirmPassword" 
                                    placeholder="Confirmar contraseña" 
                                    type="password"
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
                        >
                            {{ isLogin ? 'Iniciar Sesión' : 'Crear Cuenta' }}
                        </ion-button>

                    </form>
                </div>
            </div>
        </ion-content>
    </ion-page>
</template>

<script setup lang="ts">
//import { createUser } from '@/';
import { 
    IonPage, IonContent, IonItem, IonInput, IonButton, IonIcon,
    toastController, useIonRouter
} from '@ionic/vue';
import { ref, reactive, onMounted } from 'vue';
import { personOutline, mailOutline, lockClosedOutline } from 'ionicons/icons';
import { createUser, loginUser } from '@/lib/api';

const isLogin = ref(true);

const namee = ref('');
const email = ref('');
const password = ref('');


const formData = reactive({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
});
console.log("🚀 ~ formData:", formData)

const router = useIonRouter();

onMounted(() => {
    // Si ya hay sesión iniciada, redirigir al Home (Tab1)
    if (localStorage.getItem('forgy_session')) {
        router.replace('/tabs/c');
    }
});



function completeAuth(session: { token?: string; user?: unknown; tokenData?: unknown }) {
    localStorage.setItem('forgy_session', JSON.stringify(session));
    router.replace('/tabs/home');
}

async function forgotPassword() {
    await showToast('Funcionalidad de recuperación pendiente', 'medium');
}

const createUserr = async (name: string, email: string, password: string) => {
    // Lógica para crear usuario (simulada)
    
    try {
        const res = await createUser(name, email, password);
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

async function handleSubmit() {
    if (isLogin.value) {

        const res = await loginUser(email.value, password.value);
        console.log('login exitoso');
        
        // Lógica de login
        console.log('Login:', email);
        await showToast('Iniciando sesión...');
        completeAuth({ token: res?.token, user: res?.user, tokenData: res?.tokenData });

        
    } else {
        // Lógica de registro
        const res = await createUser(email.value, password.value, namee.value);
        
        await showToast('Creando cuenta...');
        
        completeAuth({ token: res?.token, user: res?.user, tokenData: res?.tokenData });
    }
}

async function showToast(message: string, color = 'primary') {
    const toast = await toastController.create({
        message,
        duration: 2000,
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
