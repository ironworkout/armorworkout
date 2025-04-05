// --- CONFIGURATION & CONSTANTES ---
const GOOGLE_CLIENT_ID = "731283926358-viam3ulpgna14flfdeb9m92l8s620hoi.apps.googleusercontent.com"; // Remplacez par votre ID Client
const GOOGLE_DRIVE_SCOPES = 'https://www.googleapis.com/auth/drive.file';
const HISTORY_FILENAME = "armorworkout_history.csv"; // Pour la durée et le type
// Format historique actuel (CSV simple) ne supporte PAS le stockage de poids/reps par exo.
// Le Volume Load historique et les graphiques par exercice nécessiteraient une refonte (ex: JSON).
const PROGRAM_FILENAMES = { Push: "armorworkout_push_program.csv", Pull: "armorworkout_pull_program.csv", Legs: "armorworkout_legs_program.csv" };
const PROGRAM_TYPES = ['Push', 'Pull', 'Legs'];
const PREPARE_DURATION = 3;
const SECONDS_PER_REP = 2.5; // Utilisé pour estimation temps total, pas crucial pour progression poids/reps
const IN_PROGRESS_KEY = 'armorWorkoutStateInProgress';

// --- DONNÉES PAR DÉFAUT ---
// Données par défaut avec champ `weight` (exemple, mettre 0 ou valeur de départ)
const defaultWorkouts = { Push: [{type:"exercise",name:"Band Standing Chest Press",details:"Élastique 15kg à porte",reps:13, weight: 15},{type:"exercise",name:"Band Bench Press",details:"Élastique 25kg",reps:15, weight: 25},{type:"break",duration:75,name:"Repos"},{type:"exercise",name:"Band Standing Chest Press",details:"Élastique 15kg à porte",reps:13, weight: 15},{type:"exercise",name:"Band Bench Press",details:"Élastique 25kg",reps:15, weight: 25},{type:"break",duration:75,name:"Repos"},{type:"exercise",name:"Band Standing Chest Press",details:"Élastique 15kg à porte",reps:14, weight: 15},{type:"exercise",name:"Band Bench Press",details:"Élastique 25kg",reps:15, weight: 25},{type:"break",duration:75,name:"Repos"},{type:"exercise",name:"Overhead Press",details:"Élastique 15kg",reps:12, weight: 15},{type:"exercise",name:"Triceps Pushdown",details:"Élastique 15kg",reps:15, weight: 15},{type:"break",duration:60,name:"Repos"},{type:"exercise",name:"Overhead Press",details:"Élastique 15kg",reps:12, weight: 15},{type:"exercise",name:"Triceps Pushdown",details:"Élastique 15kg",reps:15, weight: 15}], Pull: [{type:"exercise",name:"Band Bent-over Row",details:"Élastique 25 kg",reps:12, weight: 25},{type:"exercise",name:"Band Face Pull",details:"Élastique 15 kg",reps:14, weight: 15},{type:"break",duration:75,name:"Repos"},{type:"exercise",name:"Band Bent-over Row",details:"Élastique 25 kg",reps:12, weight: 25},{type:"exercise",name:"Band Face Pull",details:"Élastique 15 kg",reps:14, weight: 15},{type:"break",duration:75,name:"Repos"},{type:"exercise",name:"Band Bent-over Row",details:"Élastique 25 kg",reps:13, weight: 25},{type:"exercise",name:"Band Face Pull",details:"Élastique 15 kg",reps:15, weight: 15},{type:"break",duration:75,name:"Repos"},{type:"exercise",name:"Bicep Curls",details:"Élastique 15 kg",reps:12, weight: 15},{type:"exercise",name:"Lat Pulldown (Band)",details:"Élastique 25 kg",reps:12, weight: 25},{type:"break",duration:60,name:"Repos"},{type:"exercise",name:"Bicep Curls",details:"Élastique 15 kg",reps:12, weight: 15},{type:"exercise",name:"Lat Pulldown (Band)",details:"Élastique 25 kg",reps:12, weight: 25}], Legs: [{type:"exercise",name:"Front squat",details:"Élastique 15+25 kg + Haltère 5kg",reps:13, weight: 45},{type:"exercise",name:"Fentes Arrière",details:"Élastique 25 kg",reps:10, weight: 25},{type:"break",duration:90,name:"Repos"},{type:"exercise",name:"Front squat",details:"Élastique 15+25 kg + Haltère 5kg",reps:13, weight: 45},{type:"exercise",name:"Fentes Arrière",details:"Élastique 25 kg",reps:10, weight: 25},{type:"break",duration:90,name:"Repos"},{type:"exercise",name:"Front squat",details:"Élastique 15+25 kg + Haltère 5kg",reps:14, weight: 45},{type:"exercise",name:"Fentes Arrière",details:"Élastique 25 kg",reps:11, weight: 25},{type:"break",duration:90,name:"Repos"},{type:"exercise",name:"Romanian Deadlift (Band)",details:"Élastique 25kg",reps:15, weight: 25},{type:"exercise",name:"Calf Raises",details:"Bodyweight or Band",reps:20, weight: 0},{type:"break",duration:60,name:"Repos"},{type:"exercise",name:"Romanian Deadlift (Band)",details:"Élastique 25kg",reps:15, weight: 25},{type:"exercise",name:"Calf Raises",details:"Bodyweight or Band",reps:20, weight: 0}] };

// --- Éléments DOM (Déclaration Globale) ---
let timeLeftDisplay, timerCircle, timerStateDisplay, currentExerciseContainer,
    progressTracker, startPauseBtn, skipBtn, finishBtn, resetBtn, navButtons,
    navHistoryBtn, themeToggleBtn, messageArea, workoutSection, historySection,
    historyList, statsDisplay, statsContentWrapper, historyFilterBtns, historyChartCanvas,
    signInButton, signOutButton, driveStatusElement,
    postWorkoutSummary, summaryTitle, summaryItemsList, confirmSummaryBtn, exportAllDataBtn,
    discardSummaryBtn, closeSummaryBtn,
    historyDriveStatus, totalProgressCircle,
    currentExerciseNameDisplay, driveConnectionStatusMain, driveConnectionText, previousPerformanceDisplay,
    summaryVolumeLoadDisplay, // Ajout pour le volume dans le résumé
    timerDisplayElement, chartPlaceholder, progressTextArea, historyActionsContainer;

// --- Variables d'État (Déclaration Globale) ---
let currentWorkoutType = null, currentWorkoutPlan = [], originalCompletedWorkoutPlan = [];
let currentItemIndex = 0, timerInterval = null, prepareCountdownInterval = null;
let totalTime = 0, timeLeft = 0, prepareTimeLeft = 0;
let totalWorkoutEstimatedSeconds = 0, elapsedWorkoutEstimatedSeconds = 0;
let isTimerRunning = false, isWorkoutActive = false, workoutFinished = false, wasFinishedState = false;
let currentState = 'idle'; // idle, preparing, exercise, break, paused, finished
let workoutStartTime = null, workoutHistory = []; // Historique simple (date, type, durée)
let currentHistoryPeriod = 'week', historyChart = null;
let googleAccessToken = null, tokenClient = null;
let historyFileId = null, programFileIds = { Push: null, Pull: null, Legs: null };
let programsLoaded = false, loadedWorkouts = JSON.parse(JSON.stringify(defaultWorkouts));
let summaryChangesMade = false, isSavingDriveData = false;
let currentTheme = 'dark', messageTimeoutId = null;
let audioContext = null; // Audio Context

// --- Audio & Vibration ---
let endSound = () => console.log("Beep! (AudioContext non initialisé)");
function initAudioContext() {
    if (audioContext || typeof window === 'undefined' || (!window.AudioContext && !window.webkitAudioContext)) return;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log("AudioContext initialisé.");
        const unlock = () => { // Resume on user interaction
            if (audioContext.state === 'suspended') audioContext.resume().then(() => {
                console.log("AudioContext resumed");
                document.removeEventListener('click', unlock); document.removeEventListener('touchend', unlock);
            }); else { document.removeEventListener('click', unlock); document.removeEventListener('touchend', unlock); }
        };
        document.addEventListener('click', unlock); document.addEventListener('touchend', unlock);
        endSound = () => playActualSound(); // Assign working sound function
    } catch (e) { console.warn("AudioContext échec:", e); audioContext = null; }
}
function playActualSound() {
    if (!audioContext || audioContext.state !== 'running') return;
    try {
        const o = audioContext.createOscillator(); const g = audioContext.createGain();
        o.connect(g); g.connect(audioContext.destination); o.type = 'triangle';
        o.frequency.setValueAtTime(659.25, audioContext.currentTime); // E5
        g.gain.setValueAtTime(0.2, audioContext.currentTime); // Reduced volume slightly
        g.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.5);
        o.start(audioContext.currentTime); o.stop(audioContext.currentTime + 0.5);
    } catch(e) { console.error("Erreur lecture son:", e); }
}
const vibrate = (pattern = [100]) => { // Simpler default pattern
    if ('vibrate' in navigator) { try { navigator.vibrate(pattern); } catch (e) { /* Ignore vibration errors */ } }
};

// --- Google Identity Services (GIS) & Drive API ---
async function gisLoadedCallback() {
    console.log("GIS Library Loaded");
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === "VOTRE ID CLIENT ICI") {
        console.error("CRITICAL: GOOGLE_CLIENT_ID is not configured!");
        showMessage("Erreur critique : ID Client Google manquant.", 10000);
        if (driveStatusElement) { driveStatusElement.textContent = 'Erreur Config ID'; driveStatusElement.classList.add('error'); driveStatusElement.style.display = 'inline-block'; }
        updateAuthUI(false);
        return;
    }
    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID, scope: GOOGLE_DRIVE_SCOPES,
            callback: tokenCallback, // Fonction pour gérer la réponse
            error_callback: handleTokenError, // Fonction pour gérer les erreurs
            prompt: '' // Ne pas afficher de pop-up automatically
        });
        console.log("Token Client initialisé.");
    } catch (error) {
        console.error("Erreur initialisation Token Client:", error);
        showMessage("Erreur initialisation Google.", 5000);
        updateAuthUI(false);
        if (driveStatusElement) { driveStatusElement.textContent = 'Erreur Init Auth'; driveStatusElement.classList.add('error'); driveStatusElement.style.display = 'inline-block'; }
    }
}
function handleTokenError(error) {
    console.error("Token Client Error:", error); let msg = `Erreur Auth Google: ${error.type||error.error||'Inconnue'}`; let status = 'Erreur Auth';
    if (driveStatusElement) { driveStatusElement.classList.remove('loading','success'); driveStatusElement.classList.add('error'); driveStatusElement.style.display = 'inline-block'; }
    if (error.error === 'popup_closed' || error.error === 'user_cancel') { msg = "Connexion Google annulée."; status = 'Annulé'; }
    else if (error.error === 'popup_failed_to_open') { msg = "Popup Google bloqué."; status = 'Popup Bloqué'; }
    else if (error.error === 'access_denied') { msg = "Accès Drive refusé."; status = 'Accès Refusé'; }
    showMessage(msg, 6000); if (driveStatusElement) driveStatusElement.textContent = status; updateAuthUI(false);
}
async function tokenCallback(tokenResponse) {
    if (driveStatusElement) { driveStatusElement.classList.remove('loading', 'error', 'success'); driveStatusElement.style.display = 'inline-block'; }
    if (tokenResponse && tokenResponse.access_token) {
        console.log("Access Token reçu."); googleAccessToken = tokenResponse.access_token; updateAuthUI(true);
        showMessage("Connecté. Chargement données...", 2500); if (driveStatusElement) { driveStatusElement.textContent = 'Chargement...'; driveStatusElement.classList.add('loading'); }
        try {
            // Charger l'historique (simple) et les programmes (avec poids)
            await Promise.all([loadHistoryFromDrive(), loadProgramsFromDrive()]);
            console.log("Historique et programmes chargés (ou défauts).");
            if (programsLoaded) showMessage("Données prêtes.", 2000);
            if (driveStatusElement) { driveStatusElement.textContent = 'Connecté'; driveStatusElement.classList.remove('loading'); driveStatusElement.classList.add('success'); }
            loadInProgressState(); // Essayer de reprendre un état après chargement
            updateAuthUI(true); // Assure que l'UI est à jour après tout ça
        } catch (error) {
            console.error("CRITICAL Error during data loading:", error);
            showMessage("Erreur chargement données Drive.", 6000);
            if (driveStatusElement) { driveStatusElement.textContent = 'Erreur Données'; driveStatusElement.classList.remove('loading'); driveStatusElement.classList.add('error'); }
            updateAuthUI(true); // Reste loggué mais avec erreur
        }
    } else { handleTokenError(tokenResponse || {error:"invalid_response"}); } // Gérer réponse invalide
}
function handleAuthClick() {
    initAudioContext(); if (!tokenClient) { showMessage("Services Google non prêts...", 2000); return; }
    if (driveStatusElement) { driveStatusElement.textContent = 'Connexion...'; driveStatusElement.classList.add('loading'); driveStatusElement.classList.remove('error','success'); driveStatusElement.style.display = 'inline-block'; }
    tokenClient.requestAccessToken({ prompt: 'consent' }); // Demande explicite
}
function handleSignoutClick(showMsg = true) {
    const token = googleAccessToken; if (!token) { updateAuthUI(false); return; }
    if (showMsg && driveStatusElement) { driveStatusElement.textContent = 'Déconnexion...'; driveStatusElement.classList.add('loading'); driveStatusElement.style.display = 'inline-block'; }
    google.accounts.oauth2.revoke(token, () => {
        console.log('Token revoked'); googleAccessToken = null; historyFileId = null; programFileIds = { Push: null, Pull: null, Legs: null };
        programsLoaded = false; workoutHistory = []; loadedWorkouts = JSON.parse(JSON.stringify(defaultWorkouts));
        if (isWorkoutActive || currentState !== 'idle') resetCurrentWorkout(); else updateAuthUI(false);
        if (showMsg) showMessage("Déconnecté.", 2000);
        if (driveStatusElement) { driveStatusElement.textContent = ''; driveStatusElement.style.display = 'none'; }
    });
}
function updateAuthUI(isLoggedIn) {
    console.log(`Update UI - LoggedIn: ${isLoggedIn}, ProgsLoaded: ${programsLoaded}, State: ${currentState}`);
    const body = document.body; body.classList.toggle('logged-in', isLoggedIn); body.classList.toggle('logged-out', !isLoggedIn);
    if (driveStatusElement) { driveStatusElement.style.display = isLoggedIn ? 'inline-block' : 'none'; if (!isLoggedIn) driveStatusElement.textContent = ''; }
    if (driveConnectionStatusMain && driveConnectionText) { const driveIcon = driveConnectionStatusMain.querySelector('i'); driveConnectionStatusMain.style.display = isLoggedIn ? 'inline-flex' : 'none'; if (isLoggedIn) { if (driveStatusElement?.classList.contains('loading')) { driveConnectionText.textContent = "Chargement..."; if (driveIcon) driveIcon.classList.add('fa-spin'); } else if (driveStatusElement?.classList.contains('error')) { driveConnectionText.textContent = `Erreur Drive`; if (driveIcon) driveIcon.classList.remove('fa-spin'); } else { driveConnectionText.textContent = "Connecté"; if (driveIcon) driveIcon.classList.remove('fa-spin'); } } else if (driveIcon) driveIcon.classList.remove('fa-spin'); }
    if (historyDriveStatus && historyActionsContainer) { historyActionsContainer.style.display = isLoggedIn ? 'flex' : 'none'; if (isLoggedIn) { if (driveStatusElement?.classList.contains('loading')) { historyDriveStatus.textContent = 'Sync...'; } else if (driveStatusElement?.classList.contains('error')) { historyDriveStatus.textContent = 'Erreur Sync'; } else { historyDriveStatus.textContent = 'Synchro OK'; } } }
    if(themeToggleBtn) themeToggleBtn.disabled = false;
    if(navHistoryBtn) navHistoryBtn.disabled = ['preparing', 'exercise', 'break', 'paused'].includes(currentState);

    // Activation/désactivation bouton export
    if (exportAllDataBtn) {
        exportAllDataBtn.disabled = !isLoggedIn;
    }

    if (navButtons) navButtons.forEach(btn => btn.disabled = !(isLoggedIn && programsLoaded && ['idle', 'finished'].includes(currentState)));

    // Gestion boutons contrôle principaux
    if (startPauseBtn && skipBtn && finishBtn && resetBtn) {
        if (currentState === 'idle') {
            // Cache le container d'ajustement des reps
            const repAdjustContainer = document.getElementById('in-workout-rep-adjust-container');
            if (repAdjustContainer) {
                repAdjustContainer.style.display = 'none';
                repAdjustContainer.innerHTML = ''; // Vider au cas où
            }
            startPauseBtn.disabled = !(isLoggedIn && programsLoaded && !!currentWorkoutType);
            skipBtn.disabled = true; finishBtn.disabled = true; resetBtn.disabled = !currentWorkoutType;
        } else if (currentState === 'finished') {
            startPauseBtn.disabled = true; // Désactivé pdt modal
            skipBtn.disabled = true; finishBtn.disabled = true; resetBtn.disabled = !isLoggedIn;
        }
        // Les autres états sont gérés dans setState
    }
    updateWorkoutInfo(); // Met à jour les infos affichées (inclut perf précédentes)
    displayHistory(currentHistoryPeriod); // Met à jour l'affichage de l'historique
}
async function findOrCreateFile(filename, defaultCsvContent = "") {
    console.log(`Drive: Find/Create ${filename}`); if (!googleAccessToken) return null;
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(filename)}'+and+mimeType='text/csv'+and+trashed=false&spaces=drive&fields=files(id,name)`;
    try {
        const searchRes = await fetch(searchUrl, { headers: { 'Authorization': `Bearer ${googleAccessToken}` } });
        if (!searchRes.ok) { if (searchRes.status === 401 || searchRes.status === 403) { handleSignoutClick(false); showMessage("Session Google expirée.", 5000); return null; } throw new Error(`Search ${filename} (${searchRes.status})`); }
        const searchData = await searchRes.json();
        if (searchData.files && searchData.files.length > 0) return searchData.files[0].id;
        console.log(`Drive: Creating ${filename}...`);
        const createUrl = `https://www.googleapis.com/drive/v3/files`;
        const metadata = { name: filename, mimeType: 'text/csv' };
        const createRes = await fetch(createUrl, { method: 'POST', headers: { 'Authorization': `Bearer ${googleAccessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(metadata) });
        if (!createRes.ok) throw new Error(`Create ${filename} (${createRes.status})`);
        const createData = await createRes.json(); const newFileId = createData.id;
        const writeSuccess = await updateFileContent(newFileId, defaultCsvContent);
        return writeSuccess ? newFileId : null;
    } catch (error) { console.error(`Drive Error (findOrCreate ${filename}):`, error); showMessage(`Erreur Drive (${filename.substring(0,10)}): ${error.message}`, 6000); return null; }
}
async function readFileContent(fileId) {
    if (!googleAccessToken || !fileId) return null;
    console.log(`Drive: Reading ${fileId}`); const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    try {
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${googleAccessToken}` } });
        if (!response.ok) { if (response.status === 404) return ""; if (response.status === 401 || response.status === 403) { handleSignoutClick(false); showMessage("Session expirée.", 5000); return null; } throw new Error(`Read ${fileId} (${response.status})`); }
        return await response.text();
    } catch (error) { console.error(`Drive Error (readFile ${fileId}):`, error); showMessage(`Erreur Lecture Drive: ${error.message}`, 6000); return null; }
}
async function updateFileContent(fileId, content) {
    if (!googleAccessToken || !fileId) return false; if (isSavingDriveData) { showMessage("Sauvegarde Drive en cours...", 1500); return false; }
    console.log(`Drive: Writing ${fileId}...`); isSavingDriveData = true;
    const url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`; let success = false;
    try {
        const response = await fetch(url, { method: 'PATCH', headers: { 'Authorization': `Bearer ${googleAccessToken}`, 'Content-Type': 'text/csv' }, body: content });
        if (!response.ok) { if (response.status === 401 || response.status === 403) { handleSignoutClick(false); showMessage("Session expirée. Sauvegarde échouée.", 6000); } else { throw new Error(`Write ${fileId} (${response.status})`); } }
        else success = true;
    } catch (error) { console.error(`Drive Error (updateFile ${fileId}):`, error); showMessage(`Erreur Écriture Drive: ${error.message}`, 6000); success = false; }
    finally { isSavingDriveData = false; console.log(`Drive: Write ${fileId} finished. Success: ${success}`); }
    return success;
}

// --- Fonctions Cœur du Timer ---
function formatTime(seconds) { const m = Math.floor(Math.max(0, seconds) / 60); const s = Math.max(0, seconds) % 60; return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`; }
function calculateTotalEstimatedTime(plan) { let t = 0; plan.forEach(i => t += (i.type === 'break' ? (i.duration||0) : (i.reps||0)*SECONDS_PER_REP)); return t; }
function updateTotalProgressCircle() {
    if (!totalProgressCircle || totalWorkoutEstimatedSeconds <= 0) { if(totalProgressCircle) totalProgressCircle.style.setProperty('--total-progress-gradient', `var(--total-progress-bg)`); return; } let elapsed = 0; for (let i = 0; i < currentItemIndex; i++) elapsed += (currentWorkoutPlan[i]?.estimatedDuration || 0); const current = currentWorkoutPlan[currentItemIndex]; if ((currentState === 'break' || currentState === 'paused') && current?.type === 'break' && totalTime > 0) elapsed += Math.min(totalTime - timeLeft, current.estimatedDuration || totalTime); else if (currentState === 'finished') elapsed = totalWorkoutEstimatedSeconds; const perc = totalWorkoutEstimatedSeconds > 0 ? Math.min(100, (elapsed / totalWorkoutEstimatedSeconds) * 100) : 0; const grad = `conic-gradient(from 180deg, var(--neon-blue) ${perc}%, var(--neon-pink) ${Math.min(100, perc + 30)}%, var(--total-progress-bg) ${perc}%)`; totalProgressCircle.style.setProperty('--total-progress-gradient', grad);
}
function updateTimerDisplay() {
    if (!timeLeftDisplay || !timerCircle || !timerStateDisplay) return;
    let perc = 0, timeStr = "00:00", color = '--color-idle', glow = '--glow-idle', stateStr = '';
    const item = currentWorkoutPlan[currentItemIndex]; // Item courant pour contexte

    switch(currentState) {
        case 'break': if (totalTime > 0) perc = Math.min(100, ((totalTime - timeLeft) / totalTime) * 100); timeStr = formatTime(timeLeft); color = '--color-break'; glow = '--glow-break'; stateStr = 'Repos'; break;
        case 'paused': if (item?.type === 'break' && totalTime > 0) { perc = Math.min(100, ((totalTime - timeLeft) / totalTime) * 100); timeStr = formatTime(timeLeft); } else timeStr = "PAUSE"; color = '--color-paused'; glow = '--glow-paused'; stateStr = 'En Pause'; break;
        case 'preparing': perc = Math.min(100, ((PREPARE_DURATION - prepareTimeLeft) / PREPARE_DURATION) * 100); timeStr = formatTime(prepareTimeLeft); color = '--color-prepare'; glow = '--glow-prepare'; stateStr = 'Préparation'; break;
        case 'finished': perc = 100; timeStr = "FINI"; color = '--color-finished'; glow = '--glow-finished'; stateStr = 'Terminé !'; break;
        case 'exercise': timeStr = "GO!"; color = '--color-exercise'; glow = '--glow-exercise'; stateStr = 'Exercice'; break;
        default: timeStr = formatTime(0); color = '--color-idle'; glow = '--glow-idle'; break; // idle
    }
    timeLeftDisplay.textContent = timeStr; timerCircle.style.setProperty('--current-step-color', `var(${color})`); timerCircle.style.setProperty('--current-step-glow', `var(${glow})`); timerCircle.style.backgroundImage = `conic-gradient(var(${color}) ${perc}%, transparent ${perc}%)`; timerStateDisplay.textContent = stateStr; timerStateDisplay.style.color = `var(${color})`;
    updateTotalProgressCircle();

    // Gérer l'affichage de l'ajustement des reps pendant la pause
    const repAdjustContainer = document.getElementById('in-workout-rep-adjust-container');
    if (repAdjustContainer) {
        if (currentState === 'break' && currentItemIndex + 1 < currentWorkoutPlan.length) {
            const nextItem = currentWorkoutPlan[currentItemIndex + 1];
            if (nextItem && nextItem.type === 'exercise') {
                repAdjustContainer.innerHTML = `
                    <span>Suivant: <strong>${nextItem.name}</strong> (<span id="next-reps-display">${nextItem.reps ?? 'N/A'}</span> reps)</span>
                    <div> <!-- Wrapper pour boutons -->
                        <button class="in-workout-rep-adjust-btn minus" data-adjust-index="${currentItemIndex + 1}" aria-label="Diminuer reps prochain exercice">-</button>
                        <button class="in-workout-rep-adjust-btn plus" data-adjust-index="${currentItemIndex + 1}" aria-label="Augmenter reps prochain exercice">+</button>
                    </div>
                `;
                repAdjustContainer.style.display = 'flex'; // Afficher le conteneur
                // Ajouter les listeners aux nouveaux boutons
                repAdjustContainer.querySelectorAll('.in-workout-rep-adjust-btn').forEach(btn => {
                    btn.removeEventListener('click', handleInWorkoutRepAdjust); // Précaution
                    btn.addEventListener('click', handleInWorkoutRepAdjust);
                });
            } else {
                repAdjustContainer.style.display = 'none'; // Cacher si le suivant n'est pas un exo
            }
        } else {
            repAdjustContainer.style.display = 'none'; // Cacher dans les autres états
            repAdjustContainer.innerHTML = ''; // Vider le contenu
        }
    }
}
function updateWorkoutInfo() {
    if (!currentExerciseContainer || !currentExerciseNameDisplay || !progressTracker || !progressTextArea || !previousPerformanceDisplay) return;

    const item = currentWorkoutPlan[currentItemIndex];
    let info = '', name = '', progress = '';
    const body = document.body;

    // Masquer l'affichage des perfs précédentes par défaut
    previousPerformanceDisplay.style.display = 'none';

    if (currentState === 'idle') {
        if (googleAccessToken) {
            progress = programsLoaded ? (currentWorkoutType ? `Prêt: ${currentWorkoutType}` : "Sélectionnez...") : "Chargement...";
        } else {
            progress = "Connectez-vous.";
        }
        name = "ArmorWorkout";
        info = `<div class="idle-message"><i class="fas fa-info-circle"></i> ${progress}</div>`;
    } else if (currentState === 'finished') {
        const dur = workoutStartTime ? formatTime((Date.now() - workoutStartTime) / 1000) : 'N/A';
        name = 'Terminé !';
        info = `<div class="exercise-details"><span><i class="fas ${getIconForState('finished')}"></i> Bravo !</span> <span>Temps: <strong>${dur}</strong></span></div>`;
        progress = `Fini (${originalCompletedWorkoutPlan.length}/${originalCompletedWorkoutPlan.length})`;
    } else if (currentState === 'preparing') {
        const next = currentWorkoutPlan[0];
        name = `Préparez: ${next?.name || '?'}`;
        info = `<div class="break-info" style="border-color: var(--color-prepare);"><i class="fas ${getIconForState('preparing')} fa-spin"></i><span> Prêt dans ${prepareTimeLeft}s...</span></div>`;
        progress = `Prépa... (1/${currentWorkoutPlan.length})`;
    } else if (item) {
        name = `${item.name || (item.type === 'break' ? 'Repos' : '?')}`;
        progress = `Étape ${currentItemIndex + 1}/${currentWorkoutPlan.length}`;
        if (item.type === 'exercise') {
            const r = (item.reps != null) ? `${item.reps}` : '-';
            const w = (item.weight != null) ? `${item.weight} kg` : '-'; // Format weight
            const d = item.details || '';
            // Afficher l'objectif/dernière perf
            previousPerformanceDisplay.textContent = `Objectif (Dernière fois): ${r} reps @ ${w}`;
            previousPerformanceDisplay.style.display = 'block';
            // Afficher les détails de l'exercice actuel (qui incluent aussi les objectifs r et w)
            info = `<div class="exercise-details">
                        <span><i class="fas fa-dumbbell"></i> Reps: <strong>${r}</strong></span>
                        <span><i class="fas fa-weight-hanging"></i> Poids: <strong>${w}</strong></span>
                        ${d ? `<span class="details-text"><i class="fas fa-info-circle"></i> ${d}</span>`: ''}
                    </div>`;
        } else if (item.type === 'break') {
            info = `<div class="break-info"><i class="fas ${getIconForType('break')}"></i><span>Pause: ${formatTime(item.duration || 0)}</span></div>`;
        }
    } else if (isWorkoutActive) { // Cas fallback si item est undefined mais actif
        name = 'Chargement...';
        info = '<p>Patientez...</p>';
        progress = `Étape ?/${currentWorkoutPlan.length}`;
    }

    currentExerciseNameDisplay.textContent = name;
    currentExerciseContainer.innerHTML = info; // Mettre à jour les détails de l'exercice ou le message idle
    progressTextArea.textContent = progress;
    // Appliquer la classe d'état au body
    body.className = body.className.replace(/state-\w+/g, '').trim();
    body.classList.add(`state-${currentState}`);
}
function getIconForState(state){ switch(state){ case 'exercise': return 'fa-dumbbell'; case 'break': return 'fa-hourglass-half'; case 'preparing': return 'fa-spinner'; case 'paused': return 'fa-pause-circle'; case 'finished': return 'fa-check-circle'; default: return 'fa-play-circle'; }}
function getIconForType(type){ return type === 'exercise' ? 'fa-dumbbell' : 'fa-hourglass-half'; }

function setState(newState) {
    if (!startPauseBtn || !skipBtn || !finishBtn || !resetBtn || !timerStateDisplay || !workoutSection || !timerDisplayElement) { console.error("setState: DOM Elements Missing."); return; }
    const previousState = currentState; currentState = newState; console.log(`State: ${previousState} -> ${newState}`);
    clearInterval(timerInterval); clearInterval(prepareCountdownInterval);
    if (timerStateDisplay) { timerStateDisplay.classList.remove('preparing'); timerStateDisplay.classList.toggle('visible', newState !== 'idle');}
    if (timerDisplayElement) timerDisplayElement.classList.remove('finished-animation');
    document.body.className = document.body.className.replace(/state-\w+/g, '').trim(); document.body.classList.add(`state-${currentState}`);
    document.body.classList.toggle('workout-active', !['idle', 'finished'].includes(newState));
    startPauseBtn.className = ''; // Clear specific button state classes
    startPauseBtn.disabled = true; skipBtn.disabled = true; finishBtn.disabled = true; resetBtn.disabled = true;
    if (navButtons) navButtons.forEach(btn => btn.disabled = !(googleAccessToken && programsLoaded && ['idle', 'finished'].includes(newState)));
    if (navHistoryBtn) navHistoryBtn.disabled = !['idle', 'finished'].includes(newState);

    switch (newState) {
        case 'idle': isTimerRunning=false; isWorkoutActive=false; workoutFinished=false; timeLeft=0; totalTime=0; updateAuthUI(!!googleAccessToken); break;
        case 'preparing': isWorkoutActive=true; if(timerStateDisplay) timerStateDisplay.classList.add('preparing'); prepareTimeLeft = PREPARE_DURATION; startPauseBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Prêt...`; startPauseBtn.className = 'preparing-btn'; if (googleAccessToken) resetBtn.disabled = false; startPrepareCountdown(); break;
        case 'exercise': isWorkoutActive=true; timeLeft=0; totalTime=0; if (googleAccessToken) { startPauseBtn.disabled=false; startPauseBtn.innerHTML=`<i class="fas ${getIconForType('exercise')}"></i> Fait`; startPauseBtn.className='done-btn'; skipBtn.disabled=false; finishBtn.disabled=false; resetBtn.disabled=false; } break;
        case 'break': isTimerRunning=true; isWorkoutActive=true; if (googleAccessToken) { startPauseBtn.disabled=false; startPauseBtn.innerHTML=`<i class="fas ${getIconForState('paused')}"></i> Pause`; startPauseBtn.className='pause-btn'; skipBtn.disabled=false; finishBtn.disabled=false; resetBtn.disabled=false; } startBreakTimer(); break;
        case 'paused': isTimerRunning=false; isWorkoutActive=true; if (googleAccessToken) { startPauseBtn.disabled=false; startPauseBtn.innerHTML=`<i class="fas fa-play"></i> Reprendre`; startPauseBtn.className='resume-btn'; skipBtn.disabled=false; finishBtn.disabled=false; resetBtn.disabled=false; } break;
        case 'finished': isWorkoutActive=false; workoutFinished=true; wasFinishedState=true; timeLeft=0; totalTime=0; elapsedWorkoutEstimatedSeconds=totalWorkoutEstimatedSeconds; startPauseBtn.disabled=true; startPauseBtn.innerHTML=`<i class="fas ${getIconForState('finished')}"></i> Terminé`; startPauseBtn.className='finished-btn'; if (googleAccessToken) resetBtn.disabled=false; showMessage('Terminé ! 💪', 3000); vibrate([150, 50, 150]); endSound(); originalCompletedWorkoutPlan = JSON.parse(JSON.stringify(currentWorkoutPlan)); saveWorkoutToHistory(); clearInProgressState(); if (timerDisplayElement) timerDisplayElement.classList.add('finished-animation'); setTimeout(populateAndShowSummary, 500); break;
        default: console.error("Unknown state:", newState); currentState = 'idle'; updateAuthUI(!!googleAccessToken); break;
    }
    updateTimerDisplay(); // Met à jour le cercle, temps, état texte, boutons +/-
    updateWorkoutInfo(); // Met à jour nom exo, détails, perf précédentes
}
function startPrepareCountdown() { if (prepareCountdownInterval) clearInterval(prepareCountdownInterval); prepareTimeLeft = PREPARE_DURATION; updateTimerDisplay(); updateWorkoutInfo(); if (timerStateDisplay) timerStateDisplay.textContent = `PRÊT DANS ${prepareTimeLeft}`; prepareCountdownInterval = setInterval(() => { prepareTimeLeft--; updateTimerDisplay(); updateWorkoutInfo(); if (timerStateDisplay) timerStateDisplay.textContent = `PRÊT DANS ${prepareTimeLeft}`; if (prepareTimeLeft <= 0) { clearInterval(prepareCountdownInterval); endSound(); vibrate(); const first = currentWorkoutPlan[0]; if (!first) { resetCurrentWorkout(); return; } setState(first.type === 'exercise' ? 'exercise' : 'break'); if(first.type === 'break') { totalTime = first.duration || 0; timeLeft = totalTime; } saveInProgressState(); } }, 1000); }
function startBreakTimer() {
    if (timerInterval) clearInterval(timerInterval);
    // Mettre à jour l'affichage immédiatement (pour montrer les boutons +/- etc.)
    updateTimerDisplay();
    // Démarrer le décompte
    timerInterval = setInterval(() => { if (timeLeft > 0) { timeLeft--; updateTimerDisplay(); saveInProgressState(); } else { clearInterval(timerInterval); handleItemCompletion(true); } }, 1000);
}
function handleItemCompletion(naturalEnd = false) { if (!['exercise', 'break', 'paused'].includes(currentState)) return; const idx = currentItemIndex; if (currentWorkoutPlan[idx]?.estimatedDuration) elapsedWorkoutEstimatedSeconds += currentWorkoutPlan[idx].estimatedDuration; if (naturalEnd && currentState === 'break') { endSound(); vibrate(); } currentItemIndex++; saveInProgressState(); if (currentItemIndex >= currentWorkoutPlan.length) setState('finished'); else { const next = currentWorkoutPlan[currentItemIndex]; if (!next) { setState('finished'); return; } setState(next.type === 'exercise' ? 'exercise' : 'break'); if(next.type === 'break') { totalTime = next.duration || 0; timeLeft = totalTime; } } }
function forceFinishWorkout() { if (!isWorkoutActive || workoutFinished || currentState === 'preparing') return; if (confirm("Terminer maintenant ?")) { clearInterval(timerInterval); clearInterval(prepareCountdownInterval); setState('finished'); showMessage("Terminé manuellement.", 2500); } }
function loadWorkout(type) { if (!googleAccessToken) { showMessage("Connectez-vous.", 3000); return; } if (!programsLoaded) { showMessage("Programmes non chargés.", 3000); return; } if (isWorkoutActive && currentWorkoutType !== type) { if (!confirm(`Arrêter "${currentWorkoutType}" et charger "${type}" ?`)) { setActiveWorkoutNav(currentWorkoutType); return; } resetCurrentWorkout(); } else if (currentState === 'finished' && currentWorkoutType !== type) resetCurrentWorkout(); else if (currentWorkoutType === type && (isWorkoutActive || currentState === 'idle')) { showMessage(`"${type}" déjà ${isWorkoutActive ? 'actif' : 'sélectionné'}.`, 2000); showSection('workout'); setActiveWorkoutNav(type); return; } if (!loadedWorkouts[type]) { showMessage(`Erreur: Programme ${type} absent.`, 4000); return; } console.log(`Load: ${type}`); currentWorkoutType = type; currentWorkoutPlan = JSON.parse(JSON.stringify(loadedWorkouts[type])); if (!currentWorkoutPlan || currentWorkoutPlan.length === 0) { showMessage(`Erreur: Prog "${type}" vide.`, 4000); currentWorkoutType = null; return; } totalWorkoutEstimatedSeconds = calculateTotalEstimatedTime(currentWorkoutPlan); elapsedWorkoutEstimatedSeconds = 0; currentItemIndex = 0; workoutStartTime = null; isTimerRunning = false; isWorkoutActive = false; workoutFinished = false; setActiveWorkoutNav(type); showSection('workout'); closeSummary(false); setState('idle'); showMessage(`"${type}" chargé.`, 2500); }
function resetCurrentWorkout() { console.log("Reset..."); clearInterval(timerInterval); clearInterval(prepareCountdownInterval); const type = currentWorkoutType; currentWorkoutType=null; currentWorkoutPlan=[]; originalCompletedWorkoutPlan=[]; currentItemIndex=0; workoutStartTime=null; isTimerRunning=false; isWorkoutActive=false; workoutFinished=false; wasFinishedState=false; timeLeft=0; totalTime=0; prepareTimeLeft=0; totalWorkoutEstimatedSeconds=0; elapsedWorkoutEstimatedSeconds=0; clearInProgressState(); closeSummary(false); if (timerDisplayElement) timerDisplayElement.classList.remove('finished-animation'); setActiveWorkoutNav(null); showSection('workout'); setState('idle'); if (type) showMessage(`"${type}" réinitialisé.`, 2000); }
function showMessage(msg, duration = 3000) { if (!messageArea) return; messageArea.textContent = msg; messageArea.classList.add('visible'); if (messageTimeoutId) clearTimeout(messageTimeoutId); messageTimeoutId = setTimeout(() => messageArea.classList.remove('visible'), duration); }

// --- Gestion Thème ---
function applyTheme(theme) { const b = document.body; currentTheme = theme; b.classList.remove('light-theme', 'dark-theme'); b.classList.add(theme + '-theme'); if(themeToggleBtn) themeToggleBtn.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>'; try { localStorage.setItem('theme', theme); } catch(e){} if (historyChart) updateChartTheme(); }
function updateChartTheme() { /* Chart theme update logic - simplified for brevity */ if (!historyChart) return; const styles=getComputedStyle(document.documentElement); const grid=styles.getPropertyValue('--border-color').trim(); const text=styles.getPropertyValue('--primary-text-color').trim(); const tooltip=styles.getPropertyValue('--secondary-bg-color').trim(); const prim=styles.getPropertyValue('--neon-blue').trim(); const acc=styles.getPropertyValue('--neon-pink').trim(); try { historyChart.options.scales.x.grid.color=grid; historyChart.options.scales.y.grid.color=grid; historyChart.options.scales.x.ticks.color=text; historyChart.options.scales.y.ticks.color=text; if(historyChart.options.scales.x.title) historyChart.options.scales.x.title.color=text; if(historyChart.options.scales.y.title) historyChart.options.scales.y.title.color=text; historyChart.options.plugins.tooltip.backgroundColor=tooltip; historyChart.options.plugins.tooltip.titleColor=text; historyChart.options.plugins.tooltip.bodyColor=text; historyChart.data.datasets[0].backgroundColor=prim+'99'; historyChart.data.datasets[0].borderColor=prim; historyChart.data.datasets[0].hoverBackgroundColor=acc+'CC'; historyChart.data.datasets[0].hoverBorderColor=acc; historyChart.update('none'); } catch(e){console.error("Chart theme update error", e)} }

// --- Affichage Sections ---
function showSection(sectionName) { if (!workoutSection || !historySection) return; if (sectionName === 'history' && isWorkoutActive && !workoutFinished) { if (confirm("Arrêter l'entraînement pour voir l'historique ?")) resetCurrentWorkout(); else return; } setTimeout(() => showSectionActual(sectionName), isWorkoutActive ? 100 : 0); }
function showSectionActual(name) { closeSummary(false); const isHistory = name === 'history'; if (workoutSection) workoutSection.classList.toggle('section-hidden', isHistory); if (historySection) historySection.classList.toggle('section-hidden', !isHistory); if (navHistoryBtn) navHistoryBtn.classList.toggle('active', isHistory); if (isHistory) { setActiveWorkoutNav(null); displayHistory(currentHistoryPeriod); } else setActiveWorkoutNav(currentWorkoutType); setState(currentState); } // Re-apply state for nav button status
function setActiveWorkoutNav(type) { if (!navButtons) return; navButtons.forEach(b => b.classList.toggle('active', b.dataset.workout === type)); }

// --- Persistance Locale ---
function saveInProgressState() { if (!isWorkoutActive || workoutFinished || !['exercise','break','paused','preparing'].includes(currentState)) { clearInProgressState(); return; } const state = { type: currentWorkoutType, index: currentItemIndex, timeLeft: timeLeft, totalTime: totalTime, currentState: currentState, startTime: workoutStartTime, totalEstimated: totalWorkoutEstimatedSeconds, elapsedEstimated: elapsedWorkoutEstimatedSeconds, currentPlan: currentWorkoutPlan /* Sauvegarde aussi le plan avec reps ajustées */ }; try { localStorage.setItem(IN_PROGRESS_KEY, JSON.stringify(state)); } catch (e) { console.error("Local save failed:", e); } }
function loadInProgressState() { const json = localStorage.getItem(IN_PROGRESS_KEY); if (!json) return false; try { const s = JSON.parse(json); if (!s || !s.type || !PROGRAM_TYPES.includes(s.type) || s.index==null || !['exercise','break','paused','preparing'].includes(s.currentState) || !s.currentPlan || s.index >= s.currentPlan.length) { clearInProgressState(); return false; } if (googleAccessToken && programsLoaded && confirm(`Reprendre "${s.type}" (Étape ${s.index+1}, ${s.currentState}) ?`)) { currentWorkoutType = s.type; currentWorkoutPlan = s.currentPlan; // Restaure le plan potentiellement modifié totalWorkoutEstimatedSeconds = s.totalEstimated; elapsedWorkoutEstimatedSeconds = s.elapsedEstimated; currentItemIndex = s.index; workoutStartTime = s.startTime; workoutFinished = false; isWorkoutActive = true; setActiveWorkoutNav(s.type); showSection('workout'); timeLeft = s.timeLeft; totalTime = s.totalTime; prepareTimeLeft = (s.currentState === 'preparing') ? s.timeLeft : 0; setState(s.currentState); showMessage(`Progression "${s.type}" restaurée.`, 2500); return true; } else if (googleAccessToken) clearInProgressState(); } catch (e) { clearInProgressState(); } return false; }
function clearInProgressState() { try { localStorage.removeItem(IN_PROGRESS_KEY); } catch (e) {} }

// --- Gestion Historique ---
function handleExportAllData() {
    if (!googleAccessToken) { showMessage("Connectez-vous pour exporter.", 3000); return; }
    if (!workoutHistory || workoutHistory.length === 0) { showMessage("Aucun historique (simple) à exporter.", 3000); return; }

    console.log(`Exporting ${workoutHistory.length} simple history entries...`);
    let csvContent = "DateISO,WorkoutType,DurationSeconds,EntryID\n"; // Header pour l'historique simple
    // Trier par date ascendante pour l'export
    const sortedHistory = [...workoutHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
    sortedHistory.forEach(entry => {
        csvContent += `${entry.date},${(entry.type || '').replace(/,/g, '')},${entry.duration || 0},${entry.id}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) { // Feature detection
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().slice(0, 10);
        link.setAttribute("href", url);
        link.setAttribute("download", `armorworkout_history_export_${timestamp}.csv`); // Nom de fichier différent
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showMessage("Exportation historique terminée.", 2500);
    } else {
        showMessage("Exportation directe non supportée par ce navigateur.", 4000);
    }
}
function saveWorkoutToHistory() { // Sauvegarde l'historique SIMPLE (type, durée)
    if (!currentWorkoutType || !workoutStartTime || !googleAccessToken) return;
    const duration = Math.round((Date.now() - workoutStartTime) / 1000);
    if (duration < 10) return; // Ignorer les séances trop courtes
    const entry = { id: Date.now().toString(), date: new Date().toISOString(), type: currentWorkoutType, duration: duration };
    workoutHistory.unshift(entry);
    if (historySection && !historySection.classList.contains('section-hidden')) {
        displayHistory(currentHistoryPeriod); // Met à jour l'affichage
    }
    saveHistoryToDrive(); // Sauvegarde le fichier CSV simple
}
async function saveHistoryToDrive() { // Sauvegarde le fichier CSV simple
    if (!googleAccessToken) return;
    if (!historyFileId) historyFileId = await findOrCreateFile(HISTORY_FILENAME, "DateISO,WorkoutType,DurationSeconds,EntryID\n");
    if (!historyFileId) return;
    let csv = "DateISO,WorkoutType,DurationSeconds,EntryID\n";
    workoutHistory.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(e => csv += `${e.date},${(e.type||'').replace(/,/g,'')},${e.duration||0},${e.id}\n`);
    const ok = await updateFileContent(historyFileId, csv);
    if (historyDriveStatus) historyDriveStatus.textContent = ok ? 'Synchro OK' : 'Erreur Sync';
}
async function loadHistoryFromDrive() { // Charge l'historique SIMPLE
    if (!googleAccessToken) { workoutHistory = []; displayHistory(); return false; }
    if (historyDriveStatus) historyDriveStatus.textContent = 'Chargement...';
    if (!historyFileId) historyFileId = await findOrCreateFile(HISTORY_FILENAME, "DateISO,WorkoutType,DurationSeconds,EntryID\n");
    if (!historyFileId) { workoutHistory=[]; displayHistory(); if(historyDriveStatus) historyDriveStatus.textContent='Erreur Accès'; return false; }
    const csv = await readFileContent(historyFileId);
    if (csv === null) { workoutHistory=[]; displayHistory(); if(historyDriveStatus) historyDriveStatus.textContent='Erreur Lecture'; return false; }
    parseAndLoadHistoryCsvData(csv); // Parse le CSV simple
    displayHistory(); // Affiche l'historique simple
    if(historyDriveStatus) historyDriveStatus.textContent = workoutHistory.length > 0 ? 'Synchro OK' : 'Hist. Vide';
    return true;
}
function parseAndLoadHistoryCsvData(csv) { // Parse le CSV simple
    try {
        const lines = csv.trim().split(/\r?\n/); const hist = []; const ids = new Set();
        const start = (lines[0]||'').toLowerCase().includes("dateiso") ? 1 : 0;
        for (let i=start; i<lines.length; i++) {
            const vals = lines[i].split(','); if (vals.length < 3) continue;
            const date = new Date(vals[0]?.trim()); const type = vals[1]?.trim();
            const dur = parseInt(vals[2]?.trim(), 10); const id = vals[3]?.trim() || `${date.getTime()}-${i}`;
            if (isNaN(date.getTime()) || !PROGRAM_TYPES.includes(type) || isNaN(dur) || dur < 0 || ids.has(id)) continue;
            hist.push({ id, date: date.toISOString(), type, duration: dur }); ids.add(id);
        }
        workoutHistory = hist.sort((a, b) => new Date(b.date) - new Date(a.date));
        console.log(`Simple History parsed: ${workoutHistory.length} entries.`);
    } catch (e) { console.error("History parse error:", e); workoutHistory = []; }
}
function displayHistory(period = currentHistoryPeriod) { // Affiche l'historique SIMPLE
    if (!historyList || !statsDisplay || !statsContentWrapper || !historyFilterBtns) return;
    currentHistoryPeriod = period;
    historyFilterBtns.forEach(b => b.classList.toggle('active', b.dataset.period === period));
    const connected = !!googleAccessToken;
    const filtered = filterHistoryByPeriod(connected ? workoutHistory : [], period);
    historyList.innerHTML = !connected ? '<li class="no-history">Connectez-vous.</li>' : filtered.length === 0 ? '<li class="no-history">Aucun entraînement.</li>' : filtered.map(e => { const d = new Date(e.date); return `<li><span class="history-item-date">${d.toLocaleDateString('fr-FR',{year:'numeric',month:'short',day:'numeric'})} <small>(${d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})})</small></span><span class="history-item-type">${e.type}</span><span class="history-item-duration">${formatTime(e.duration)}</span></li>`; }).join('');
    displayStatsAndMotivation(filtered, period, connected); // Affiche stats simples
    renderHistoryChart(filtered, period, connected); // Affiche graphique durée
}
function filterHistoryByPeriod(hist, period) { const now=new Date(); const today=new Date(now.getFullYear(), now.getMonth(), now.getDate()); return hist.filter(e => { const d=new Date(e.date); if(isNaN(d.getTime())) return false; switch(period){ case 'week': const day=today.getDay(); const diff=today.getDate()-day+(day===0?-6:1); const startW=new Date(now.getFullYear(),now.getMonth(),diff); startW.setHours(0,0,0,0); return d>=startW; case 'month': return d>=new Date(now.getFullYear(), now.getMonth(), 1); case 'year': return d>=new Date(now.getFullYear(), 0, 1); default: return true; }}); }
function displayStatsAndMotivation(hist, period, connected) { // Affiche stats SIMPLES
    if(!statsDisplay || !statsContentWrapper) return;
    const {count, totalDuration, avgDuration, mostFrequentType, frequency} = calculateStats(hist);
    let p=''; switch(period){ case 'week': p='Semaine'; break; case 'month': p='Mois'; break; case 'year': p='Année'; break; default: p='Total'; }
    const title = statsDisplay.querySelector('h3'); if(title) title.textContent = `Stats (${p})`;
    let html = !connected ? "<p>Connectez-vous.</p>" : count === 0 ? "<p>Aucune donnée.</p>" : `<p><i class="fas fa-calendar-check"></i> Nb: <strong>${count}</strong></p><p><i class="fas fa-stopwatch"></i> Total: <strong>${formatTime(totalDuration)}</strong></p><p><i class="fas fa-hourglass-half"></i> Moy: <strong>${formatTime(avgDuration)}</strong></p><p><i class="fas fa-star"></i> Fréquent: <strong>${mostFrequentType||'N/A'}</strong> (${frequency[mostFrequentType]||0}x)</p>`;
    statsContentWrapper.innerHTML = html;
    // Note: Le Volume Load historique n'est pas affiché ici.
    let msgEl = statsDisplay.querySelector('.motivational-message'); if (!msgEl) { msgEl = document.createElement('p'); msgEl.className = 'motivational-message'; statsDisplay.appendChild(msgEl); } msgEl.textContent = connected ? generateMotivationalMessage({count}) : "";
}
// CalculateStats - Ne calcule PAS le volume load historique car non stocké
function calculateStats(hist) {
    let count = 0, totDur = 0, freq = { Push: 0, Pull: 0, Legs: 0 };
    hist.forEach(e => {
        const d = Number(e.duration); if (!isNaN(d)) { count++; totDur += d; }
        if (freq[e.type] != null) freq[e.type]++;
    });
    const avgDur = count > 0 ? Math.round(totDur / count) : 0;
    let mfType = null, maxF = -1;
    for (const t in freq) { if (freq[t] > maxF) { maxF = freq[t]; mfType = t; } }
    if (maxF <= 0) mfType = null;
    // !! Le Volume Load historique n'est pas calculé ici car le poids/reps par exo n'est pas dans `hist` !!
    return { count, totalDuration: totDur, avgDuration: avgDur, frequency: freq, mostFrequentType: mfType };
}
function generateMotivationalMessage({count}) { if(!googleAccessToken || count == null) return ""; if (count === 0) return "Planifiez votre prochain entraînement ! 💪"; if (count >= 100) return `Légendaire ! Plus de ${count} séances ! 🏆`; if (count >= 50) return `Impressionnant ! ${count} séances ! 🏋️‍♂️`; if (count >= 20) return `${count} séances, beau parcours ! 🌟`; return `Déjà ${count} entraînement${count > 1 ? 's' : ''} ! Continuez ! 🎯`; }

// --- Gestion Programmes ---
function convertProgramToCsv(prog) {
    const h="Type,Name,Details,Reps,Duration,Weight\n"; // Ajout colonne Weight
    return h + prog.map(i => {
        const esc = (f) => { if(f==null) return ''; const s=String(f); return (s.includes(',')||s.includes('"')||s.includes('\n')) ? `"${s.replace(/"/g,'""')}"` : s; };
        if(i.type==='exercise') return `${i.type},${esc(i.name)},${esc(i.details)},${i.reps??''},,${i.weight??''}\n`; // Ajout weight
        if(i.type==='break') return `${i.type},${esc(i.name||'Repos')},,,${i.duration||''},\n`; // Colonne weight vide pour break
        return '';
    }).join('');
}
function parseProgramCsvData(csv) {
    const prog=[]; if(!csv || typeof csv !== 'string') return prog;
    const lines=csv.trim().split(/\r?\n/);
    const headerLine = lines[0] || '';
    const hasWeightHeader = headerLine.toLowerCase().includes('weight');
    const expectedColumns = hasWeightHeader ? 6 : 5;
    const start= headerLine.toLowerCase().startsWith("type,name") ? 1 : 0;

    const parseLine=(l)=>{ const v=[]; let cur=''; let q=false; for(let i=0; i<l.length; i++){ const c=l[i]; if(c==='"' && q && l[i+1]==='"'){cur+='"';i++;} else if(c==='"'){q=!q;} else if(c===','&&!q){v.push(cur);cur='';} else cur+=c; } v.push(cur); return v.map(s=>s.trim()); };

    for(let i=start; i<lines.length; i++){
        const line=lines[i].trim(); if(!line) continue;
        const vals=parseLine(line);
        // Pad missing columns at the end if necessary (e.g., old format without weight)
        while (vals.length < expectedColumns) {
            vals.push('');
        }

        const type=vals[0]?.toLowerCase();
        const name=vals[1];
        const details=vals[2];
        const repsStr=vals[3];
        const durStr=vals[4];
        const weightStr = vals[5] ?? ''; // Récupérer la 6ème colonne ou vide si absent

        if (type === 'exercise') {
            const r = parseInt(repsStr, 10);
            const w = parseFloat(weightStr); // Utiliser parseFloat pour le poids
            if (name) {
                prog.push({
                    type: 'exercise',
                    name,
                    details,
                    reps: (!isNaN(r) && repsStr !== '') ? r : null,
                    weight: (!isNaN(w) && weightStr !== '') ? w : null // Stocker le poids (null si non trouvé/invalide)
                });
            }
        } else if (type === 'break') {
            const d = parseInt(durStr, 10);
            if (!isNaN(d) && d > 0) prog.push({ type: 'break', duration: d, name: name || 'Repos' });
        }
    }
    return prog;
}
async function loadProgramsFromDrive() {
    console.log("Loading programs...");
    if (!googleAccessToken) {
        loadedWorkouts = JSON.parse(JSON.stringify(defaultWorkouts));
        programsLoaded = false;
        updateAuthUI(false);
        return false;
    }
    programsLoaded = false; let allOk = true;
    if (driveStatusElement) { driveStatusElement.textContent='Load Progs...'; driveStatusElement.classList.add('loading'); driveStatusElement.classList.remove('error','success'); }
    const promises = PROGRAM_TYPES.map(async type => {
        const filename=PROGRAM_FILENAMES[type];
        const defProg=defaultWorkouts[type]||[];
        const defCsv=convertProgramToCsv(defProg); // Génère CSV avec colonne poids
        const fileId = await findOrCreateFile(filename, defCsv);
        programFileIds[type]=fileId;
        if (!fileId) { loadedWorkouts[type]=JSON.parse(JSON.stringify(defProg)); return false; }
        const csv = await readFileContent(fileId);
        if (csv === null) { loadedWorkouts[type]=JSON.parse(JSON.stringify(defProg)); return false; }
        try {
            const parsed = parseProgramCsvData(csv); // Parse CSV (gère avec ou sans colonne poids)
            loadedWorkouts[type] = (parsed.length > 0) ? parsed : JSON.parse(JSON.stringify(defProg));
            // Vérification simple - si le premier exercice n'a pas de poids défini après parsing, afficher message (optionnel)
            if (parsed.length > 0 && parsed.find(item => item.type === 'exercise')?.weight === null) {
                console.warn(`Programme ${type} chargé, mais la colonne poids semble manquante ou invalide dans le fichier CSV.`);
                // showMessage(`Format ${filename} peut-être ancien (sans poids). Défaut chargé si vide.`, 4000); // Optionnel
            }
            return true;
        } catch (e) {
            console.error(`Parse error ${type}:`, e);
            loadedWorkouts[type]=JSON.parse(JSON.stringify(defProg));
            return false;
        }
    });
    try { const results = await Promise.all(promises); allOk = results.every(r => r); }
    catch (e) {
         console.error("Program loading error:", e); allOk = false;
         PROGRAM_TYPES.forEach(t => { if(!loadedWorkouts[t]) loadedWorkouts[t]=JSON.parse(JSON.stringify(defaultWorkouts[t]||[])); });
    }
    programsLoaded = true;
    console.log(`Programs loaded. Drive OK: ${allOk}`);
    if (driveStatusElement) {
        driveStatusElement.classList.remove('loading');
        if (!allOk) { driveStatusElement.textContent='Erreur Progs'; driveStatusElement.classList.add('error'); }
        else { driveStatusElement.textContent='Connecté'; driveStatusElement.classList.add('success'); driveStatusElement.classList.remove('error'); }
    }
    updateAuthUI(true);
    return programsLoaded;
}

// --- Graphique ---
// Fonction pour gérer l'ajustement des reps PENDANT l'entraînement (état break)
function handleInWorkoutRepAdjust(e) {
    const button = e.currentTarget;
    const adjustIndex = parseInt(button.dataset.adjustIndex, 10);

    if (isNaN(adjustIndex) || adjustIndex < 0 || adjustIndex >= currentWorkoutPlan.length) {
        console.error("Invalid index for rep adjustment:", button.dataset.adjustIndex);
        return;
    }

    const targetItem = currentWorkoutPlan[adjustIndex];
    if (!targetItem || targetItem.type !== 'exercise') {
        console.error("Target item for rep adjustment is not an exercise:", targetItem);
        return;
    }

    let currentReps = targetItem.reps ?? 0; // Traite null/undefined comme 0
    if (button.classList.contains('plus')) {
        currentReps++;
    } else if (button.classList.contains('minus')) {
        currentReps = Math.max(0, currentReps - 1); // Empêche les reps négatives
    }
    targetItem.reps = currentReps; // Met à jour le modèle de données
    // Met à jour l'affichage immédiatement
    const repsDisplay = document.getElementById('next-reps-display');
    if (repsDisplay) {
        repsDisplay.textContent = currentReps;
    }
    saveInProgressState(); // Sauvegarde l'état avec le plan modifié
}
function renderHistoryChart(hist, period, connected) { // Affiche Graphique de DURÉE
    if (!historyChartCanvas || !chartPlaceholder || typeof Chart === 'undefined') return; // Check for Chart
    const ctx = historyChartCanvas.getContext('2d'); if (!ctx) return;
    // NOTE: Pour l'instant, ce graphique reste basé sur la DURÉE TOTALE par période.
    // L'affichage de la progression POIDS/VOLUME par EXERCICE nécessite une refonte
    // majeure de la structure de l'historique (non implémentée ici).
    // Les graphiques 3D ne sont pas supportés nativement par Chart.js.
    if (historyChart) historyChart.destroy(); historyChart = null;
    historyChartCanvas.style.display = 'block'; chartPlaceholder.style.display = 'none';
    if (!connected) { historyChartCanvas.style.display = 'none'; chartPlaceholder.textContent = "Connectez-vous."; chartPlaceholder.style.display = 'block'; return; }
    const { labels, data } = aggregateChartData(hist, period); // Agrège la durée
    if (labels.length === 0 || data.every(d => d === 0)) { historyChartCanvas.style.display = 'none'; chartPlaceholder.textContent = "Aucune donnée."; chartPlaceholder.style.display = 'block'; return; }
    const styles=getComputedStyle(document.documentElement); const prim=styles.getPropertyValue('--neon-blue').trim(); const acc=styles.getPropertyValue('--neon-pink').trim(); const grid=styles.getPropertyValue('--border-color').trim(); const text=styles.getPropertyValue('--primary-text-color').trim(); const tipBg=styles.getPropertyValue('--secondary-bg-color').trim();
    try {
        historyChart=new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label:'Durée (min)', data: data.map(d=>d/60), backgroundColor: prim+'99', borderColor: prim, borderWidth:1, hoverBackgroundColor:acc+'CC', hoverBorderColor:acc, borderRadius:4 }] }, options: { responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true, title:{ display:true, text:'Minutes', color:text }, grid:{ color:grid }, ticks:{ color:text, callback: v => v+'m' } }, x:{ title:{ display:true, text: getChartXAxisTitle(period), color:text }, grid:{ display:false }, ticks:{ color:text } } }, plugins:{ legend:{ display:false }, tooltip:{ backgroundColor:tipBg, titleColor:text, bodyColor:text, padding:8, cornerRadius:4, displayColors:false, callbacks:{ label: ctx => `Durée: ${formatTime(data[ctx.dataIndex]||0)}` } } } } });
    } catch (e) { console.error("Chart error:", e); chartPlaceholder.textContent = "Erreur graphique."; chartPlaceholder.style.display = 'block'; }
}
function aggregateChartData(hist, period) { // Agrège la DURÉE
    const agg=new Map(); const init=(ls)=>ls.forEach(l=>agg.set(l,0)); switch(period){ case 'week': const days=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']; init(days); const nowW=new Date(); const todayW=new Date(nowW.getFullYear(), nowW.getMonth(), nowW.getDate()); const wd=todayW.getDay(); const diff=todayW.getDate()-wd+(wd===0?-6:1); const startW=new Date(nowW.getFullYear(),nowW.getMonth(),diff); startW.setHours(0,0,0,0); hist.forEach(e=>{const d=new Date(e.date); if(d>=startW){let idx=d.getDay(); idx=idx===0?6:idx-1; agg.set(days[idx],(agg.get(days[idx])||0)+(e.duration||0));}}); return {labels:days, data:days.map(d=>agg.get(d))}; case 'month': const weeks=['S1-7','S8-14','S15-21','S22-28','S29+']; init(weeks); const curM=new Date().getMonth(); const curY=new Date().getFullYear(); hist.forEach(e=>{const d=new Date(e.date); if(d.getMonth()===curM&&d.getFullYear()===curY){const day=d.getDate(); let wi=0; if(day<=7)wi=0; else if(day<=14)wi=1; else if(day<=21)wi=2; else if(day<=28)wi=3; else wi=4; agg.set(weeks[wi],(agg.get(weeks[wi])||0)+(e.duration||0));}}); return {labels:weeks, data:weeks.map(w=>agg.get(w))}; case 'year': const months=['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc']; init(months); const curY2=new Date().getFullYear(); hist.forEach(e=>{const d=new Date(e.date); if(d.getFullYear()===curY2){const mi=d.getMonth(); agg.set(months[mi],(agg.get(months[mi])||0)+(e.duration||0));}}); return {labels:months, data:months.map(m=>agg.get(m))}; default: const yearData={}; hist.forEach(e=>{const y=new Date(e.date).getFullYear(); yearData[y]=(yearData[y]||0)+(e.duration||0);}); const years=Object.keys(yearData).map(Number).sort((a,b)=>a-b); return {labels:years.map(String), data:years.map(y=>yearData[y])}; } }
function getChartXAxisTitle(period){ switch(period){ case 'week': return 'Jour (Sem. Courante)'; case 'month': return 'Semaine (Mois Courant)'; case 'year': return 'Mois (Année Courante)'; default: return 'Année'; }}

// --- Résumé Post-Workout ---
// Fonction pour calculer le Volume Load total pour une séance donnée
function calculateSessionVolumeLoad(workoutPlan) {
    let totalVolume = 0;
    if (!workoutPlan) return 0;
    workoutPlan.forEach(item => {
        // Utilise les reps et poids finaux de la séance
        if (item.type === 'exercise' && item.reps != null && item.weight != null && item.reps > 0 && item.weight > 0) {
            totalVolume += item.reps * item.weight;
        }
    });
    return totalVolume;
}
function populateAndShowSummary() {
    if (!originalCompletedWorkoutPlan || !summaryTitle || !summaryItemsList || !postWorkoutSummary || !summaryVolumeLoadDisplay) {
        if (currentState === 'finished') resetCurrentWorkout();
        return;
    }
    const type = currentWorkoutType;
    summaryTitle.textContent = `Résumé - ${type || '?'}`;
    summaryItemsList.innerHTML = '';
    summaryChangesMade = false;

    originalCompletedWorkoutPlan.forEach((item, idx) => {
        const li = document.createElement('li');
        li.className = `summary-item item-type-${item.type}`;
        li.dataset.index = idx;
        const icon = getIconForType(item.type);

        if (item.type === 'exercise') {
            const reps = item.reps ?? ''; // Utilise les reps finales (potentiellement modifiées in-workout)
            const weight = item.weight ?? ''; // Récupérer le poids final
            const details = item.details || '';
            // Ajout du champ Poids et ajustement layout
            li.innerHTML = `
                <h4><i class="fas ${icon}"></i> ${item.name || 'Exo'}</h4>
                <label for="sr-${idx}">Perf:</label>
                <div class="input-container">
                    <button class="rep-adjust-btn minus" data-target="sr-${idx}" aria-label="Diminuer reps">-</button>
                    <input type="number" id="sr-${idx}" value="${reps}" min="0" step="1" placeholder="Reps">
                    <button class="rep-adjust-btn plus" data-target="sr-${idx}" aria-label="Augmenter reps">+</button>
                    <span class="unit" style="margin: 0 5px;">@</span>
                    <input type="number" id="sw-${idx}" class="weight-input" value="${weight}" min="0" step="0.5" placeholder="kg">
                    <span class="unit">kg</span>
                </div>
                <div class="details-container">
                    <label for="sd-${idx}">Détails:</label>
                    <textarea id="sd-${idx}" rows="1" placeholder="Aucun détail">${details}</textarea>
                </div>
            `;
            const rI = li.querySelector(`#sr-${idx}`);
            const wI = li.querySelector(`#sw-${idx}`); // Input poids
            const dI = li.querySelector(`#sd-${idx}`);
            if (rI) rI.addEventListener('input', markSummaryChanged);
            if (wI) wI.addEventListener('input', markSummaryChanged); // Listener pour poids
            if (dI) dI.addEventListener('input', markSummaryChanged);
            li.querySelectorAll('.rep-adjust-btn').forEach(b => b.addEventListener('click', handleRepAdjust));
        } else if (item.type === 'break') {
            li.innerHTML = `<h4><i class="fas ${icon}"></i> ${item.name || 'Repos'}</h4> <p>Durée: ${formatTime(item.duration || 0)}</p>`;
        }
        summaryItemsList.appendChild(li);
    });

    // Calculer et afficher le Volume Load total pour cette séance
    const sessionVolumeLoad = calculateSessionVolumeLoad(originalCompletedWorkoutPlan);
    if (sessionVolumeLoad > 0) {
        summaryVolumeLoadDisplay.textContent = `Volume Load Séance: ${sessionVolumeLoad.toFixed(1)} kg`;
        summaryVolumeLoadDisplay.style.display = 'block';
    } else {
        summaryVolumeLoadDisplay.style.display = 'none';
    }

    updateSummaryButtonsState();
    postWorkoutSummary.classList.add('visible');
}
function markSummaryChanged() { if (!summaryChangesMade) { summaryChangesMade = true; updateSummaryButtonsState(); } }
function updateSummaryButtonsState() { if (!confirmSummaryBtn || !discardSummaryBtn || !closeSummaryBtn) return; const canSave=googleAccessToken && !isSavingDriveData; if(summaryChangesMade){ confirmSummaryBtn.style.display='inline-flex'; confirmSummaryBtn.disabled=!canSave; discardSummaryBtn.style.display='inline-flex'; discardSummaryBtn.disabled=false; closeSummaryBtn.style.display='none'; } else { confirmSummaryBtn.style.display='none'; discardSummaryBtn.style.display='none'; closeSummaryBtn.style.display='inline-flex'; closeSummaryBtn.disabled=false; } }
function handleRepAdjust(e) { const btn=e.currentTarget; const targetId=btn.dataset.target; const input=document.getElementById(targetId); if (!input) return; let val=parseInt(input.value,10)||0; if (btn.classList.contains('plus')) val++; else if (btn.classList.contains('minus')) val=Math.max(0,val-1); input.value=val; markSummaryChanged(); input.dispatchEvent(new Event('input',{bubbles:true})); }
function closeSummary(reset = false) { if (!postWorkoutSummary) return; postWorkoutSummary.classList.remove('visible'); summaryChangesMade=false; if (wasFinishedState && reset) resetCurrentWorkout(); else if (timerDisplayElement) timerDisplayElement.classList.remove('finished-animation'); wasFinishedState=false; setState(currentState); } // Re-apply state
async function handleConfirmSummary() {
    initAudioContext();
    if (!summaryChangesMade) { closeSummary(true); return; }
    if (!googleAccessToken || !currentWorkoutType || !programFileIds[currentWorkoutType]) { showMessage("Erreur: Non connecté ou ID programme manquant.", 4000); updateSummaryButtonsState(); return; }
    if (isSavingDriveData) { showMessage("Sauvegarde en cours...", 2000); return; }

    console.log("Saving summary changes...");
    confirmSummaryBtn.disabled = true; discardSummaryBtn.disabled = true;
    confirmSummaryBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Sauvegarde...`;

    const type = currentWorkoutType;
    // IMPORTANT: Appliquer les changements sur une copie du PLAN ACTUEL EN MEMOIRE (loadedWorkouts)
    // car 'originalCompletedWorkoutPlan' ne doit pas être modifié ici, il représente la séance terminée.
    const updatedPlanInMemory = JSON.parse(JSON.stringify(loadedWorkouts[type]));
    let changesApplied = 0;

    if (summaryItemsList) summaryItemsList.querySelectorAll('.summary-item[data-index]').forEach(li => {
        const idx = parseInt(li.dataset.index, 10);
        if (isNaN(idx) || idx < 0 || idx >= updatedPlanInMemory.length) return;
        const itemInMemory = updatedPlanInMemory[idx]; // Item du plan à sauvegarder

        if (itemInMemory?.type === 'exercise') {
            const rI = li.querySelector(`#sr-${idx}`);
            const wI = li.querySelector(`#sw-${idx}`); // Récupérer l'input poids
            const dI = li.querySelector(`#sd-${idx}`);
            if (!rI || !wI || !dI) return; // Vérifier que tous les inputs existent

            const repsRaw = rI.value.trim();
            const weightRaw = wI.value.trim();
            const reps = repsRaw === '' ? null : parseInt(repsRaw, 10);
            const weight = weightRaw === '' ? null : parseFloat(weightRaw); // Utiliser parseFloat
            const dets = dI.value.trim();

            // Validation (simple : non négatif si nombre)
            if (reps !== null && (isNaN(reps) || reps < 0)) { console.warn(`Invalid reps value at index ${idx}: ${repsRaw}`); return; }
            if (weight !== null && (isNaN(weight) || weight < 0)) { console.warn(`Invalid weight value at index ${idx}: ${weightRaw}`); return; }

            // Vérifier si quelque chose a changé par rapport à l'état actuel du plan en mémoire
            const rChanged = (itemInMemory.reps ?? null) !== reps;
            const wChanged = (itemInMemory.weight ?? null) !== weight;
            const dChanged = (itemInMemory.details ?? '') !== dets;

            if (rChanged || wChanged || dChanged) {
                itemInMemory.reps = reps;
                itemInMemory.weight = weight; // Sauvegarder le poids dans la copie
                itemInMemory.details = dets;
                changesApplied++;
            }
        }
    });

    if (changesApplied === 0 && summaryChangesMade) { // Si le flag était true mais aucun changement détecté (devrait peu arriver)
        console.warn("No changes applied despite summaryChangesMade flag being true?");
        summaryChangesMade = false; // Reset flag
        updateSummaryButtonsState();
        closeSummary(true); // Ferme et reset comme si pas de changements
        return;
    } else if (changesApplied === 0 && !summaryChangesMade) { // Cas normal où on clique "Valider" sans rien changer
         closeSummary(true);
         return;
    }


    // Sauvegarde le plan modifié (updatedPlanInMemory) dans la variable globale et sur Drive
    loadedWorkouts[type] = updatedPlanInMemory; // Mettre à jour le programme en mémoire
    try {
        const csv = convertProgramToCsv(updatedPlanInMemory); // Convertir en CSV (inclut maintenant le poids)
        const ok = await updateFileContent(programFileIds[type], csv);
        if (ok) {
            showMessage(`Prog "${type}" mis à jour!`, 2500);
            closeSummary(true); // Ferme et reset après succès
        } else {
            showMessage(`Échec sauvegarde Drive ${type}.`, 5000);
            updateSummaryButtonsState(); // Réactiver les boutons si échec
        }
    } catch (e) {
        console.error(`Save summary error ${type}:`, e);
        showMessage(`Erreur sauvegarde ${type}: ${e.message}`, 5000);
        updateSummaryButtonsState(); // Réactiver les boutons si erreur
    }
}
function handleDiscardSummary() { initAudioContext(); showMessage("Modifications rejetées.", 1500); closeSummary(true); }

// --- Clic Timer ---
function handleTimerClick() { initAudioContext(); if (!isWorkoutActive || workoutFinished || !googleAccessToken) return; if (currentState==='break') setState('paused'); else if (currentState==='paused' && currentWorkoutPlan[currentItemIndex]?.type==='break') setState('break'); else if (currentState==='exercise') handleItemCompletion(false); saveInProgressState(); }

// --- Initialisation ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Init ArmorWorkout.");
    // Assign DOM Elements (using IDs)
    timeLeftDisplay = document.getElementById('time-left');
    timerCircle = document.getElementById('timer-circle');
    totalProgressCircle = document.getElementById('total-progress-circle');
    timerStateDisplay = document.getElementById('timer-state');
    currentExerciseContainer = document.getElementById('current-exercise-container');
    progressTracker = document.getElementById('progress-tracker');
    startPauseBtn = document.getElementById('start-pause-btn');
    skipBtn = document.getElementById('skip-btn');
    finishBtn = document.getElementById('finish-btn');
    resetBtn = document.getElementById('reset-btn');
    navButtons = document.querySelectorAll('nav button[data-workout]');
    navHistoryBtn = document.getElementById('nav-history');
    themeToggleBtn = document.getElementById('theme-toggle-btn');
    messageArea = document.getElementById('message-area');
    workoutSection = document.getElementById('workout-section');
    historySection = document.getElementById('history-section');
    historyList = document.getElementById('history-list');
    statsDisplay = document.getElementById('stats-display');
    if (statsDisplay) statsContentWrapper = statsDisplay.querySelector('.content-wrapper'); // Check parent first
    historyFilterBtns = document.querySelectorAll('.history-filters button');
    historyChartCanvas = document.getElementById('history-chart-canvas');
    signInButton = document.getElementById('signin-button');
    signOutButton = document.getElementById('signout-button');
    driveStatusElement = document.getElementById('drive-status');
    postWorkoutSummary = document.getElementById('post-workout-summary');
    summaryTitle = document.getElementById('summary-title');
    summaryItemsList = document.getElementById('summary-items-list');
    confirmSummaryBtn = document.getElementById('confirm-summary-btn');
    summaryVolumeLoadDisplay = document.getElementById('summary-volume-load'); // Element for volume in summary
    previousPerformanceDisplay = document.getElementById('previous-performance-display'); // Element for previous perf
    exportAllDataBtn = document.getElementById('export-all-data-btn'); // Assign new button
    discardSummaryBtn = document.getElementById('discard-summary-btn');
    closeSummaryBtn = document.getElementById('close-summary-btn');
    historyDriveStatus = document.getElementById('history-drive-status');
    currentExerciseNameDisplay = document.getElementById('current-exercise-name-display');
    driveConnectionStatusMain = document.getElementById('drive-connection-status-main');
    driveConnectionText = document.getElementById('drive-connection-text');
    timerDisplayElement = document.getElementById('timer-display-clickable');
    chartPlaceholder = document.getElementById('chart-placeholder');
    progressTextArea = document.getElementById('progress-text-area');
    historyActionsContainer = document.querySelector('.history-actions');

    // Basic Check
    if (!timeLeftDisplay || !startPauseBtn || !signInButton) {
        console.error("CRITICAL DOM INIT FAILED - Essential elements not found.");
        document.body.innerHTML = "<h1>Erreur critique au chargement.</h1><p>Vérifiez la console.</p>"; // User message
        return;
    }

    // Init State & UI
    const savedTheme = localStorage.getItem('theme');
    applyTheme((savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'dark');
    setState('idle'); // Sets initial state and calls updateAuthUI

    // Event Listeners (avec vérifications d'existence)
    if (signInButton) signInButton.addEventListener('click', handleAuthClick);
    if (signOutButton) signOutButton.addEventListener('click', () => handleSignoutClick(true));
    if (navButtons) navButtons.forEach(b => b.addEventListener('click', () => { initAudioContext(); loadWorkout(b.dataset.workout); }));
    if (navHistoryBtn) navHistoryBtn.addEventListener('click', () => { initAudioContext(); showSection('history'); });
    if (startPauseBtn) startPauseBtn.addEventListener('click', () => { initAudioContext(); if (currentState==='idle' && currentWorkoutType) { workoutStartTime=Date.now(); elapsedWorkoutEstimatedSeconds=0; setState('preparing'); } else if (currentState==='exercise') handleItemCompletion(false); else if (currentState==='break') setState('paused'); else if (currentState==='paused') setState(currentWorkoutPlan[currentItemIndex]?.type==='break' ? 'break' : 'exercise'); saveInProgressState(); });
    if (skipBtn) skipBtn.addEventListener('click', () => { initAudioContext(); if (isWorkoutActive && !workoutFinished && currentState !== 'preparing') { showMessage("Suivant...", 1000); handleItemCompletion(false); } });
    if (finishBtn) finishBtn.addEventListener('click', () => { initAudioContext(); if (isWorkoutActive && !workoutFinished && currentState !== 'preparing') forceFinishWorkout(); });
    if (resetBtn) resetBtn.addEventListener('click', () => { initAudioContext(); if (currentWorkoutType || isWorkoutActive || workoutFinished) { if (confirm("Réinitialiser ?")) resetCurrentWorkout(); } });
    if (themeToggleBtn) themeToggleBtn.addEventListener('click', () => { initAudioContext(); applyTheme(currentTheme === 'dark' ? 'light' : 'dark'); });
    if (exportAllDataBtn) exportAllDataBtn.addEventListener('click', () => { initAudioContext(); handleExportAllData(); }); // Add listener for export
    if (historyFilterBtns) historyFilterBtns.forEach(b => b.addEventListener('click', () => { initAudioContext(); displayHistory(b.dataset.period); }));
    if (confirmSummaryBtn) confirmSummaryBtn.addEventListener('click', handleConfirmSummary);
    if (discardSummaryBtn) discardSummaryBtn.addEventListener('click', handleDiscardSummary);
    if (closeSummaryBtn) closeSummaryBtn.addEventListener('click', () => closeSummary(true));
    if (timerDisplayElement) timerDisplayElement.addEventListener('click', handleTimerClick);

    console.log("App Init Complete. Waiting for GIS...");
    // GIS script onload will call gisLoadedCallback defined globally above
}); // End DOMContentLoaded
