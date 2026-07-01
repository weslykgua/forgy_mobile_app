<script setup lang="ts">
import {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonAvatar, IonButton, IonIcon, IonChip, IonLabel,
    IonList, IonListHeader, IonItem, IonToggle,
    IonModal, IonInput, IonButtons,
    onIonViewWillEnter,
    alertController,
    toastController
} from '@ionic/vue'
import { ref, computed, watch } from 'vue'
import {
    personCircle, camera, star, personOutline,
    notificationsOutline, settingsOutline, moonOutline,
    helpCircleOutline, chatbubbleOutline, starOutline, logOutOutline,
    pulseOutline, lockClosedOutline, eyeOutline, eyeOffOutline, keyOutline,
    alertCircleOutline
} from 'ionicons/icons';
import { useProfile } from '../utils/useProfile'

const darkMode = ref(false);
const healthDevicesConnected = ref(false);
const stats = ref({ totalWorkouts: 0, totalVolume: 0, streakDays: 0 })

const isSettingsModalOpen = ref(false);
const isEditProfileModalOpen = ref(false);

const settingsForm = ref({
    units: 'metric',
    waterGoal: 2500,
    sleepHours: 7.5,
    weeklyWorkouts: 4
});

const editProfileForm = ref({
    name: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
});
const editProfileError = ref('');

const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);


const { userName, userEmail, loadProfileData, logout } = useProfile()

// Configuración local para acceso a la API para no modificar useProfile.ts
const API_URL = import.meta.env.VITE_API_URL || 'https://forgybackendapi-production.up.railway.app'
const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
})

const totalDays = computed(() => stats.value.streakDays || 0);
const level = computed(() => {
    if (stats.value.totalWorkouts >= 100) return 'Élite';
    if (stats.value.totalWorkouts >= 50) return 'Pro';
    if (stats.value.totalWorkouts >= 20) return 'Intermedio';
    return 'Empezando';
})

async function getStatsFromServer() {
    try {
        const streakResponse = await fetch(`${API_URL}/user/streak`, {
            headers: getHeaders()
        });

        if (!streakResponse.ok) {
            throw new Error('No se pudo obtener la racha');
        }

        const streakData = await streakResponse.json();

        if (streakData && typeof streakData.currentStreak === 'number') {
            stats.value.streakDays = streakData.currentStreak;
        }

        const dashboardResponse = await fetch(`${API_URL}/dashboard`, {
            headers: getHeaders()
        });
        if (dashboardResponse.ok) {
            const dashboardData = await dashboardResponse.json();
            stats.value.totalWorkouts = dashboardData.totalWorkouts || 0;
        }
    } catch (error) {
        console.error('Error al obtener estadísticas del servidor:', error);
    }
}

watch(darkMode, (val) => {
    document.body.classList.toggle('dark', val);
    document.body.classList.toggle('ion-palette-dark', val);
    document.body.classList.toggle('light', !val);
    localStorage.setItem('dark_mode', val ? 'true' : 'false');
});

watch(healthDevicesConnected, (val) => {
    localStorage.setItem('health_devices_connected', val ? 'true' : 'false');
});

const showToast = async (message: string, color = 'success') => {
    const toast = await toastController.create({
        message,
        duration: 2000,
        color,
        position: 'bottom'
    });
    await toast.present();
};

const openSettingsModal = () => {
    settingsForm.value.units = localStorage.getItem('forgy_units') || 'metric';
    settingsForm.value.waterGoal = Number(localStorage.getItem('forgy_water_goal') || '2500');
    settingsForm.value.sleepHours = Number(localStorage.getItem('forgy_sleep_goal') || '7.5');
    settingsForm.value.weeklyWorkouts = Number(localStorage.getItem('forgy_weekly_workouts_goal') || '4');
    isSettingsModalOpen.value = true;
};

const saveSettings = () => {
    localStorage.setItem('forgy_units', settingsForm.value.units);
    localStorage.setItem('forgy_water_goal', settingsForm.value.waterGoal.toString());
    localStorage.setItem('forgy_sleep_goal', settingsForm.value.sleepHours.toString());
    localStorage.setItem('forgy_weekly_workouts_goal', settingsForm.value.weeklyWorkouts.toString());
    isSettingsModalOpen.value = false;
    showToast('Ajustes guardados correctamente');
};

const openEditProfileModal = () => {
    editProfileForm.value = {
        name: userName.value,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    };
    editProfileError.value = '';
    showCurrentPassword.value = false;
    showNewPassword.value = false;
    showConfirmPassword.value = false;
    isEditProfileModalOpen.value = true;
};

const saveProfile = async () => {
    editProfileError.value = '';

    // Validar contraseña
    if (editProfileForm.value.newPassword) {
        if (!editProfileForm.value.currentPassword) {
            editProfileError.value = 'Debes ingresar tu contraseña actual para cambiarla.';
            return;
        }
        if (editProfileForm.value.newPassword !== editProfileForm.value.confirmPassword) {
            editProfileError.value = 'Las nuevas contraseñas no coinciden.';
            return;
        }
        if (editProfileForm.value.newPassword.length < 6) {
            editProfileError.value = 'La nueva contraseña debe tener al menos 6 caracteres.';
            return;
        }
    }

    try {
        const headers = getHeaders();

        // 1. Actualizar Nombre si cambió
        if (editProfileForm.value.name !== userName.value) {
            const profileRes = await fetch(`${API_URL}/user/profile`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ name: editProfileForm.value.name })
            });
            if (!profileRes.ok) {
                const err = await profileRes.json();
                throw new Error(err.error || 'Error al actualizar nombre');
            }
        }

        // 2. Actualizar contraseña si se completó el campo
        if (editProfileForm.value.newPassword) {
            const passRes = await fetch(`${API_URL}/user/change-password`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    currentPassword: editProfileForm.value.currentPassword,
                    newPassword: editProfileForm.value.newPassword
                })
            });
            if (!passRes.ok) {
                const err = await passRes.json();
                throw new Error(err.error || 'Error al cambiar contraseña');
            }
        }

        await loadProfileData();
        isEditProfileModalOpen.value = false;
        showToast('Perfil actualizado correctamente');
    } catch (error: any) {
        console.error(error);
        editProfileError.value = error.message || 'Error al actualizar perfil';
    }
};

onIonViewWillEnter(() => {
    loadProfileData()
    getStatsFromServer()
    const saved = localStorage.getItem('dark_mode')
    if (saved !== null) {
        darkMode.value = saved === 'true'
    } else {
        darkMode.value = document.body.classList.contains('dark')
    }
    healthDevicesConnected.value = localStorage.getItem('health_devices_connected') === 'true'
})

async function confirmLogout() {
    const alert = await alertController.create({
        header: 'Cerrar Sesión',
        message: '¿Estás seguro de que quieres cerrar sesión?',
        buttons: [
            { text: 'Cancelar', role: 'cancel' },
            { text: 'Sí, cerrar sesión', role: 'destructive', handler: () => logout() },
        ],
    });
    await alert.present();
}
</script>

<template>
    <ion-page>
        <ion-header class="forgy-header">
            <ion-toolbar>
                <ion-title class="forgy-title">
                    Perfil
                </ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content :fullscreen="true">
            <!-- Profile Header -->
            <div class="profile-header">
                <div class="avatar-container">
                    <ion-avatar>
                        <img
                            src="https://ionicframework.com/docs/img/demos/avatar.svg"
                            alt="Avatar"
                        />
                    </ion-avatar>
                    <ion-button
                        fill="clear"
                        size="small"
                        class="edit-avatar-btn"
                    >
                        <ion-icon :icon="camera"></ion-icon>
                    </ion-button>
                </div>
                <h2 class="user-name">{{ userName }}</h2>
                <p class="user-email">{{ userEmail }}</p>
            </div>

            <!-- Stats Summary -->
            <div class="stats-summary">
                <div class="stat-item">
                    <span class="stat-value">{{ totalDays }}</span>
                    <span class="stat-label">Días activo</span>
                </div>
                <div class="stat-divider"></div>
                <div class="stat-item">
                    <span class="stat-value">{{ level }}</span>
                    <span class="stat-label">Nivel</span>
                </div>
            </div>

            <!-- Menu Options -->
            <ion-list class="menu-list">
                <ion-list-header>
                    <ion-label>Configuración</ion-label>
                </ion-list-header>

                <ion-item
                    button
                    detail
                    @click="openEditProfileModal"
                >
                    <ion-icon
                        :icon="personOutline"
                        slot="start"
                        color="primary"
                    ></ion-icon>
                    <ion-label>Editar Perfil</ion-label>
                </ion-item>

                <ion-item
                    button
                    detail
                    @click="openSettingsModal"
                >
                    <ion-icon
                        :icon="settingsOutline"
                        slot="start"
                        color="primary"
                    ></ion-icon>
                    <ion-label>Ajustes</ion-label>
                </ion-item>

                <ion-item>
                    <ion-icon
                        :icon="moonOutline"
                        slot="start"
                        color="primary"
                    ></ion-icon>
                    <ion-label>Modo Oscuro</ion-label>
                    <ion-toggle
                        slot="end"
                        v-model="darkMode"
                    ></ion-toggle>
                </ion-item>

                <ion-item>
                    <ion-icon
                        :icon="pulseOutline"
                        slot="start"
                        color="primary"
                    ></ion-icon>
                    <ion-label>Dispositivos de Salud</ion-label>
                    <ion-toggle
                        slot="end"
                        v-model="healthDevicesConnected"
                    ></ion-toggle>
                </ion-item>
            </ion-list>

            <ion-list class="menu-list">
                <ion-list-header>
                    <ion-label>Soporte</ion-label>
                </ion-list-header>

                <ion-item
                    button
                    detail
                >
                    <ion-icon
                        :icon="helpCircleOutline"
                        slot="start"
                        color="tertiary"
                    ></ion-icon>
                    <ion-label>Ayuda y FAQ</ion-label>
                </ion-item>

                <ion-item
                    button
                    detail
                >
                    <ion-icon
                        :icon="chatbubbleOutline"
                        slot="start"
                        color="tertiary"
                    ></ion-icon>
                    <ion-label>Contactar Soporte</ion-label>
                </ion-item>

                <ion-item
                    button
                    detail
                >
                    <ion-icon
                        :icon="starOutline"
                        slot="start"
                        color="tertiary"
                    ></ion-icon>
                    <ion-label>Calificar App</ion-label>
                </ion-item>
            </ion-list>

            <ion-list class="menu-list">
                <ion-item
                    lines="none"
                    class="logout-item"
                >
                    <ion-button
                        class="logout-button"
                        expand="block"
                        fill="outline"
                        color="danger"
                        @click="confirmLogout"
                    >
                        <ion-icon
                            :icon="logOutOutline"
                            slot="start"
                        ></ion-icon>
                        <span class="logout-text">Cerrar Sesión</span>
                    </ion-button>
                </ion-item>
            </ion-list>

            <!-- App Version -->
            <div class="app-version">
                <p>Forgy v1.0.0</p>
                <p>Creado para atletas</p>
            </div>

            <!-- Modal de Ajustes -->
            <ion-modal :is-open="isSettingsModalOpen" @didDismiss="isSettingsModalOpen = false" class="workout-modal">
                <ion-header class="forgy-header">
                    <ion-toolbar>
                        <ion-buttons slot="start">
                            <ion-button color="medium" @click="isSettingsModalOpen = false">Cancelar</ion-button>
                        </ion-buttons>
                        <ion-title class="forgy-title">Ajustes</ion-title>
                        <ion-buttons slot="end">
                            <ion-button strong color="primary" @click="saveSettings">Guardar</ion-button>
                        </ion-buttons>
                    </ion-toolbar>
                </ion-header>
                <ion-content class="modal-content">
                    <div class="modal-container">
                        <ion-list class="settings-list">
                            <ion-item>
                                <ion-label position="stacked">Sistema de Unidades</ion-label>
                                <div class="forgy-segment" style="margin-top: 8px;">
                                    <button type="button" class="forgy-segment-btn" :class="{ active: settingsForm.units === 'metric' }" @click="settingsForm.units = 'metric'">
                                        Métrico (kg, cm)
                                    </button>
                                    <button type="button" class="forgy-segment-btn" :class="{ active: settingsForm.units === 'imperial' }" @click="settingsForm.units = 'imperial'">
                                        Imperial (lb, in)
                                    </button>
                                </div>
                            </ion-item>
                            <ion-item>
                                <ion-label position="stacked">Objetivo de Agua Diario (ml)</ion-label>
                                <ion-input type="number" v-model.number="settingsForm.waterGoal"></ion-input>
                            </ion-item>
                            <ion-item>
                                <ion-label position="stacked">Meta de Sueño Diario (horas)</ion-label>
                                <ion-input type="number" step="0.5" v-model.number="settingsForm.sleepHours"></ion-input>
                            </ion-item>
                            <ion-item>
                                <ion-label position="stacked">Meta de Entrenos Semanales</ion-label>
                                <ion-input type="number" min="1" max="7" v-model.number="settingsForm.weeklyWorkouts"></ion-input>
                            </ion-item>
                        </ion-list>
                    </div>
                </ion-content>
            </ion-modal>

            <!-- Modal de Editar Perfil -->
            <ion-modal :is-open="isEditProfileModalOpen" @didDismiss="isEditProfileModalOpen = false" class="workout-modal">
                <ion-header class="forgy-header">
                    <ion-toolbar>
                        <ion-buttons slot="start">
                            <ion-button color="medium" @click="isEditProfileModalOpen = false">Cancelar</ion-button>
                        </ion-buttons>
                        <ion-title class="forgy-title">Editar Perfil</ion-title>
                        <ion-buttons slot="end">
                            <ion-button strong color="primary" @click="saveProfile">Guardar</ion-button>
                        </ion-buttons>
                    </ion-toolbar>
                </ion-header>
                <ion-content class="modal-content">
                    <div class="modal-container">
                        <!-- Tarjeta Datos Personales -->
                        <div class="settings-card">
                            <div class="settings-card-header">
                                <ion-icon :icon="personOutline" class="settings-card-icon"></ion-icon>
                                <span class="settings-card-title">Datos Personales</span>
                            </div>
                            <div class="settings-card-body">
                                <div class="custom-field">
                                    <label class="custom-label">Nombre Completo</label>
                                    <div class="custom-input-wrapper">
                                        <ion-icon :icon="personOutline" class="field-icon"></ion-icon>
                                        <input type="text" v-model="editProfileForm.name" class="custom-text-input" placeholder="Tu nombre" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Tarjeta Cambiar Contraseña -->
                        <div class="settings-card" style="margin-top: 16px;">
                            <div class="settings-card-header">
                                <ion-icon :icon="lockClosedOutline" class="settings-card-icon"></ion-icon>
                                <span class="settings-card-title">Cambiar Contraseña</span>
                                <span class="settings-card-tag">Opcional</span>
                            </div>
                            <div class="settings-card-body">
                                <div class="custom-field">
                                    <label class="custom-label">Contraseña Actual</label>
                                    <div class="custom-input-wrapper">
                                        <ion-icon :icon="lockClosedOutline" class="field-icon"></ion-icon>
                                        <input :type="showCurrentPassword ? 'text' : 'password'" v-model="editProfileForm.currentPassword" class="custom-text-input" placeholder="Clave actual" />
                                        <button type="button" class="eye-btn" @click="showCurrentPassword = !showCurrentPassword">
                                            <ion-icon :icon="showCurrentPassword ? eyeOffOutline : eyeOutline"></ion-icon>
                                        </button>
                                    </div>
                                </div>

                                <div class="custom-field" style="margin-top: 14px;">
                                    <label class="custom-label">Nueva Contraseña</label>
                                    <div class="custom-input-wrapper">
                                        <ion-icon :icon="keyOutline" class="field-icon"></ion-icon>
                                        <input :type="showNewPassword ? 'text' : 'password'" v-model="editProfileForm.newPassword" class="custom-text-input" placeholder="Mínimo 6 caracteres" />
                                        <button type="button" class="eye-btn" @click="showNewPassword = !showNewPassword">
                                            <ion-icon :icon="showNewPassword ? eyeOffOutline : eyeOutline"></ion-icon>
                                        </button>
                                    </div>
                                </div>

                                <div class="custom-field" style="margin-top: 14px;">
                                    <label class="custom-label">Confirmar Nueva Contraseña</label>
                                    <div class="custom-input-wrapper">
                                        <ion-icon :icon="keyOutline" class="field-icon"></ion-icon>
                                        <input :type="showConfirmPassword ? 'text' : 'password'" v-model="editProfileForm.confirmPassword" class="custom-text-input" placeholder="Repite la nueva contraseña" />
                                        <button type="button" class="eye-btn" @click="showConfirmPassword = !showConfirmPassword">
                                            <ion-icon :icon="showConfirmPassword ? eyeOffOutline : eyeOutline"></ion-icon>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Banner de Error -->
                        <div v-if="editProfileError" class="error-banner">
                            <ion-icon :icon="alertCircleOutline" class="error-banner-icon"></ion-icon>
                            <span class="error-banner-text">{{ editProfileError }}</span>
                        </div>
                    </div>
                </ion-content>
            </ion-modal>
        </ion-content>
    </ion-page>
</template>

<style scoped>
.profile-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px 16px;
    background: var(--ion-background-color);
    color: var(--forgy-text-primary);
    border-bottom: 1px solid var(--ion-border-color);
}

.avatar-container {
    position: relative;
    margin-bottom: 16px;
}

.avatar-container ion-avatar {
    width: 90px;
    height: 90px;
    border: 2px solid var(--ion-border-color);
}

.edit-avatar-btn {
    position: absolute;
    bottom: 0;
    right: -8px;
    --background: var(--forgy-input-bg);
    --color: var(--ion-color-primary);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    --border-width: 1px;
    --border-style: solid;
    --border-color: var(--ion-border-color);
}

.user-name {
    margin: 0 0 4px;
    font-size: 20px;
    font-weight: 700;
}

.user-email {
    margin: 0 0 12px;
    color: var(--forgy-text-secondary);
    font-size: 13px;
}

.stats-summary {
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 16px;
    background: var(--forgy-card-bg);
    margin: 20px 16px 16px;
    border-radius: 8px;
    border: 1px solid var(--ion-border-color);
    color: var(--forgy-text-primary);
}

.stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stat-value {
    font-size: 18px;
    font-weight: 700;
    color: var(--ion-color-primary);
}

.stat-label {
    font-size: 11px;
    color: var(--forgy-text-secondary);
    margin-top: 4px;
}

.stat-divider {
    width: 1px;
    height: 32px;
    background: var(--ion-border-color);
}

.menu-list {
    margin: 16px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--ion-border-color);
    background: var(--forgy-card-bg);
}

.menu-list ion-list-header {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--forgy-text-secondary);
    border-bottom: 1px solid var(--ion-border-color);
}

.menu-list ion-item {
    --padding-start: 16px;
    --border-color: var(--ion-border-color);
}

.menu-list ion-icon {
    font-size: 20px;
}

.logout-item {
    --background: transparent;
}

.logout-button {
    width: 100%;
    --border-radius: 6px;
    --border-width: 1px;
    --border-color: var(--ion-color-danger);
    --border-style: solid;
    --padding-top: 10px;
    --padding-bottom: 10px;
    margin: 0;
}

.logout-button::part(native) {
    text-transform: none;
    font-weight: 600;
}

.logout-text {
    display: inline-block;
    font-size: 13px;
}

.app-version {
    text-align: center;
    padding: 24px;
    color: var(--forgy-text-secondary);
    font-size: 11px;
}

.app-version p {
    margin: 2px 0;
}

/* Modals styles */
.modal-container {
    padding: 16px;
}
</style>

<style>
/* ==========================================================================
   Estilos globales para los modales (teletransportados fuera del scope de Vue)
   ========================================================================== */

/* Fondo del modal y barra de herramientas */
ion-modal.workout-modal {
    --background: var(--ion-background-color) !important;
    --border-radius: 16px;
}

ion-modal.workout-modal ion-content {
    --background: var(--ion-background-color) !important;
}

ion-modal.workout-modal ion-toolbar {
    --background: var(--forgy-card-bg) !important;
    --color: var(--forgy-text-primary) !important;
    border-bottom: 1px solid var(--ion-border-color);
}

ion-modal.workout-modal .modal-container {
    padding: 16px;
    max-width: 600px;
    margin: 0 auto;
}

/* Tarjetas y Contenedores */
ion-modal.workout-modal .settings-card {
    background: var(--forgy-card-bg);
    border: 1px solid var(--ion-border-color);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

ion-modal.workout-modal .settings-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid var(--ion-border-color);
    padding-bottom: 10px;
}

ion-modal.workout-modal .settings-card-icon {
    font-size: 16px;
    color: var(--ion-color-primary);
}

ion-modal.workout-modal .settings-card-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--forgy-text-primary);
    text-transform: uppercase;
    letter-spacing: 0.03em;
}

ion-modal.workout-modal .settings-card-tag {
    margin-left: auto;
    font-size: 9px;
    font-weight: 700;
    color: var(--forgy-text-secondary);
    background: var(--forgy-input-bg);
    padding: 3px 6px;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

ion-modal.workout-modal .settings-card-body {
    display: flex;
    flex-direction: column;
}

/* Campos de entrada personalizados */
ion-modal.workout-modal .custom-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

ion-modal.workout-modal .custom-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--forgy-text-secondary);
}

ion-modal.workout-modal .custom-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: var(--forgy-input-bg);
    border: 1px solid var(--ion-border-color);
    border-radius: 8px;
    padding: 2px 10px;
    transition: all 0.25s ease;
}

ion-modal.workout-modal .custom-input-wrapper:focus-within {
    border-color: var(--ion-color-primary);
    box-shadow: 0 0 0 2px rgba(var(--ion-color-primary-rgb), 0.15);
}

ion-modal.workout-modal .field-icon {
    font-size: 18px;
    color: var(--forgy-text-secondary);
    margin-right: 8px;
}

ion-modal.workout-modal .custom-text-input {
    background: transparent;
    border: none;
    outline: none;
    color: var(--forgy-text-primary);
    font-size: 14px;
    font-weight: 500;
    padding: 10px 0;
    flex: 1;
    width: 100%;
}

ion-modal.workout-modal .eye-btn {
    background: transparent;
    border: none;
    outline: none;
    color: var(--forgy-text-secondary);
    font-size: 18px;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: color 0.2s ease;
}

ion-modal.workout-modal .eye-btn:active {
    color: var(--ion-color-primary);
}

/* Modal de Ajustes (Estilos de Listas de Ionic) */
ion-modal.workout-modal .settings-list {
    background: transparent !important;
    padding: 0;
    margin: 0;
}

ion-modal.workout-modal .settings-list ion-item {
    --background: var(--forgy-card-bg);
    --color: var(--forgy-text-primary);
    --border-color: var(--ion-border-color);
    --padding-start: 16px;
    --padding-end: 16px;
    --inner-border-width: 0px;
    margin-bottom: 12px;
    border: 1px solid var(--ion-border-color);
    border-radius: 12px;
}

ion-modal.workout-modal .settings-list ion-label {
    color: var(--forgy-text-secondary) !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 8px;
}

ion-modal.workout-modal .settings-list ion-input {
    --color: var(--forgy-text-primary);
    font-weight: 500;
}



/* Banners de Error */
ion-modal.workout-modal .error-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    background: rgba(var(--ion-color-danger-rgb), 0.08);
    border: 1px solid rgba(var(--ion-color-danger-rgb), 0.2);
    border-radius: 8px;
    padding: 12px;
    margin-top: 16px;
}

ion-modal.workout-modal .error-banner-icon {
    font-size: 20px;
    color: var(--ion-color-danger);
    flex-shrink: 0;
}

ion-modal.workout-modal .error-banner-text {
    font-size: 12px;
    font-weight: 600;
    color: var(--ion-color-danger);
}
</style>
