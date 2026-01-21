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
import { createUser } from '@/lib/api';

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



function completeAuth() {
    localStorage.setItem('forgy_session', 'true');
    router.replace('/tabs/tab1');
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
    await createUser(email.value, password.value, namee.value); 
    if (isLogin.value) {
        // Lógica de login
        console.log('Login:', email);
        await showToast('Iniciando sesión...');
        completeAuth();
    } else {
        // Lógica de registro
        /*
        if (password !== formData.confirmPassword) {
            await showToast('Las contraseñas no coinciden', 'danger');
            return;
        }
        console.log('Register:', formData);
        await showToast('Creando cuenta...');
        */
        completeAuth();
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
.auth-container {
    min-height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--ion-color-primary) 0%, #7c4dff 100%);
    padding: 20px;
}

.auth-card {
    background: white;
    width: 100%;
    max-width: 360px;
    border-radius: 24px;
    padding: 32px 24px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.auth-header {
    text-align: center;
    margin-bottom: 24px;
}

.brand-logo {
    font-size: 48px;
    margin-bottom: 12px;
    display: inline-block;
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
    background: #ffffff;
    border-radius: 12px;
    padding: 4px;
    display: flex;
    position: relative;
    width: 100%;
}

.toggle-bg {
    position: absolute;
    top: 4px;
    left: 4px;
    width: calc(50% - 4px);
    height: calc(100% - 8px);
    background: white;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    transition: transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
}

.toggle-btn {
    flex: 1;
    background: none;
    border: none;
    padding: 10px;
    z-index: 1;
    font-weight: 600;
    font-size: 14px;
    color: var(--ion-color-medium);
    transition: color 0.3s;
    cursor: pointer;
    outline: none;
}

.toggle-btn.active {
    color: var(--ion-color-primary);
}

/* Form */
.auth-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.input-wrapper {
    background: #185592;
    border-radius: 12px;
    transition: all 0.3s ease;
}

.input-wrapper:focus-within {
    background: rgb(158, 13, 13);
    box-shadow: 0 0 0 2px var(--ion-color-primary);
}

.custom-input {
    --background: transparent;
    --padding-start: 8px;
    --inner-padding-end: 8px;
}

.custom-input ion-icon {
    color: var(--ion-color-medium);
    margin-right: 8px;
}

.forgot-password {
    text-align: right;
}

.forgot-password span {
    color: var(--ion-color-primary);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
}

.submit-btn {
    margin-top: 8px;
    --border-radius: 12px;
    font-weight: 700;
    height: 48px;
    --box-shadow: 0 4px 12px rgba(var(--ion-color-primary-rgb), 0.3);
}

.fade-in {
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>