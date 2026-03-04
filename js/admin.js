// ===================================
// Admin Dashboard JavaScript
// Wedding Management System
// ===================================

// ===================================
// API Configuration
// ===================================
const API_BASE_URL = window.location.origin.includes('localhost')
    ? 'http://localhost:3000/api'
    : 'https://wedding-api.onrender.com/api'; // Update with your Render backend URL

// API Helper
async function apiCall(endpoint, options = {}) {
    const token = sessionStorage.getItem('weddingAdminToken');
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    });
    if (!response.ok) {
        if (response.status === 401) {
            logout();
            throw new Error('Session expired');
        }
        throw new Error(await response.text());
    }
    return response.json();
}

// Global State
let currentUser = null;
let guests = [];
let currentSection = 'overview';
let charts = {};
let currentPage = 1;
let itemsPerPage = 10;

// ===================================
// INITIALIZATION
// ===================================
document.addEventListener('DOMContentLoaded', function () {
    // Initialize AOS
    AOS.init({
        duration: 600,
        once: true,
        offset: 50
    });

    // Set current date
    updateCurrentDate();

    // Check for saved login
    checkSavedLogin();

    // Initialize event listeners
    initializeEventListeners();
});

// ===================================
// AUTHENTICATION
// ===================================
function checkSavedLogin() {
    const savedUser = sessionStorage.getItem('weddingAdminUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
    }
}

function initializeEventListeners() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', handleLogin);

    // Enter key on password field
    document.getElementById('password').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            handleLogin(e);
        }
    });
}

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.toggle-password i');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.classList.remove('fa-eye');
        toggleBtn.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleBtn.classList.remove('fa-eye-slash');
        toggleBtn.classList.add('fa-eye');
    }
}

// ===================================
// AUTHENTICATION (Updated)
// ===================================
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
        const data = await apiCall('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        // Save token
        sessionStorage.setItem('weddingAdminToken', data.token);
        sessionStorage.setItem('weddingAdminUser', JSON.stringify(data.user));
        currentUser = data.user;
        showDashboard();
        showToast('Welcome back, ' + data.user.username + '!', 'success');
    } catch (error) {
        document.getElementById('loginError').classList.add('show');
    }
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem('weddingAdminUser');

    // Hide dashboard, show login
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';

    // Clear form
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').classList.remove('show');

    showToast('Logged out successfully', 'success');
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';

    // Initialize dashboard - load data from API
    loadGuests();

    // Start real-time updates
    setInterval(loadGuests, 30000); // Refresh data every 30 seconds
}

// ===================================
// NAVIGATION
// ===================================
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionName + 'Section').classList.add('active');

    // Update sidebar
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    event.currentTarget.classList.add('active');

    currentSection = sectionName;

    // Refresh data for section
    if (sectionName === 'overview') {
        updateAllStats();
        initializeCharts();
    } else if (sectionName === 'guests') {
        renderGuestTable();
    } else if (sectionName === 'meals') {
        updateMealCounts();
    }

    // Close sidebar on mobile
    if (window.innerWidth < 992) {
        document.getElementById('sidebar').classList.remove('show');
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('show');
}

// ===================================
// STATISTICS & ANALYTICS
// ===================================
function updateAllStats() {
    const totalGuests = guests.length;
    const attending = guests.filter(g => g.attendance === 'yes').length;
    const declined = guests.filter(g => g.attendance === 'no').length;
    const pending = guests.filter(g => g.attendance === 'pending').length;
    const mealsSelected = guests.filter(g => g.attendance === 'yes' && g.meal).length;

    // Update stat cards
    animateNumber('totalGuests', totalGuests);
    animateNumber('attendingGuests', attending);
    animateNumber('pendingRSVPs', pending);
    animateNumber('mealsSelected', mealsSelected);

    // Update percentages
    const attendingPercent = totalGuests > 0 ? Math.round((attending / totalGuests) * 100) : 0;
    const mealPercent = attending > 0 ? Math.round((mealsSelected / attending) * 100) : 0;

    document.getElementById('attendingPercent').textContent = attendingPercent + '%';
    document.getElementById('attendingRingText').textContent = attendingPercent + '%';
    document.getElementById('mealPercent').textContent = mealPercent + '%';

    // Update progress ring
    const circumference = 2 * Math.PI * 45;
    const offset = circumference - (attendingPercent / 100) * circumference;
    document.getElementById('attendingRing').style.strokeDashoffset = offset;

    // Update sidebar badges
    document.getElementById('sidebarGuestCount').textContent = totalGuests;
    document.getElementById('sidebarRSVPCount').textContent = attending;

    // Update RSVP stats
    document.getElementById('rsvpAccepted').textContent = attending;
    document.getElementById('rsvpDeclined').textContent = declined;
    document.getElementById('rsvpNoResponse').textContent = pending;
}

function animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    const startValue = parseInt(element.textContent) || 0;
    const duration = 1000;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.round(startValue + (targetValue - startValue) * easeOutQuart);

        element.textContent = currentValue;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

function updateRealTimeStats() {
    // Simulate real-time updates (replace with API polling)
    const randomChange = Math.random() > 0.7;
    if (randomChange && currentSection === 'overview') {
        // Randomly add a guest for demo
        if (Math.random() > 0.5) {
            updateAllStats();
            showToast('New RSVP received!', 'success');
        }
    }
}

// ===================================
// CHARTS
// ===================================
function initializeCharts() {
    // Timeline Chart
    const timelineCtx = document.getElementById('timelineChart');
    if (timelineCtx) {
        const dates = getLast30Days();
        const rsvpData = dates.map(date => {
            return guests.filter(g => g.date === date).length;
        });

        charts.timeline = new Chart(timelineCtx, {
            type: 'line',
            data: {
                labels: dates.map(d => d.slice(5)), // Remove year
                datasets: [{
                    label: 'RSVPs',
                    data: rsvpData,
                    borderColor: '#9CAF88',
                    backgroundColor: 'rgba(156, 175, 136, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#9CAF88',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
    }

    // Response Distribution Chart
    const responseCtx = document.getElementById('responseChart');
    if (responseCtx) {
        const attending = guests.filter(g => g.attendance === 'yes').length;
        const declined = guests.filter(g => g.attendance === 'no').length;
        const pending = guests.filter(g => g.attendance === 'pending').length;

        charts.response = new Chart(responseCtx, {
            type: 'doughnut',
            data: {
                labels: ['Attending', 'Declined', 'Pending'],
                datasets: [{
                    data: [attending, declined, pending],
                    backgroundColor: ['#28a745', '#dc3545', '#ffc107'],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { display: false }
                }
            }
        });

        // Custom legend
        const legendHTML = `
            <div class="legend-item">
                <span class="legend-color" style="background: #28a745;"></span>
                <span>Attending (${attending})</span>
            </div>
            <div class="legend-item">
                <span class="legend-color" style="background: #dc3545;"></span>
                <span>Declined (${declined})</span>
            </div>
            <div class="legend-item">
                <span class="legend-color" style="background: #ffc107;"></span>
                <span>Pending (${pending})</span>
            </div>
        `;
        document.getElementById('responseLegend').innerHTML = legendHTML;
    }
}

function getLast30Days() {
    const dates = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
}

function updateTimelineChart(days) {
    // Update chart with different time range
    if (charts.timeline) {
        const dates = getLastNDays(parseInt(days));
        const rsvpData = dates.map(date => {
            return guests.filter(g => g.date === date).length;
        });

        charts.timeline.data.labels = dates.map(d => d.slice(5));
        charts.timeline.data.datasets[0].data = rsvpData;
        charts.timeline.update();
    }
}

function getLastNDays(n) {
    const dates = [];
    for (let i = n - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
}

// ===================================
// GUEST MANAGEMENT
// ===================================
function renderGuestTable() {
    const tbody = document.getElementById('guestTableBody');
    const filteredGuests = getFilteredGuests();

    // Pagination
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedGuests = filteredGuests.slice(start, end);

    tbody.innerHTML = paginatedGuests.map(guest => `
        <tr data-id="${guest.id}">
            <td>
                <input type="checkbox" class="form-check-input guest-checkbox" value="${guest.id}">
            </td>
            <td>
                <div class="guest-name">
                    <div class="guest-avatar">${guest.firstName[0]}${guest.lastName[0]}</div>
                    <div class="guest-info">
                        <h4>${guest.firstName} ${guest.lastName}</h4>
                        <span>${guest.email}</span>
                    </div>
                </div>
            </td>
            <td>${guest.email}</td>
            <td>
                <span class="status-badge ${guest.attendance}">
                    <i class="fas fa-${guest.attendance === 'yes' ? 'check' : guest.attendance === 'no' ? 'times' : 'question'}"></i>
                    ${guest.attendance === 'yes' ? 'Attending' : guest.attendance === 'no' ? 'Declined' : 'Pending'}
                </span>
            </td>
            <td>${guest.guestCount}</td>
            <td>
                ${guest.meal ? `<span class="meal-badge">${getMealIcon(guest.meal)} ${capitalize(guest.meal)}</span>` : '-'}
            </td>
            <td>
                ${guest.table ? `<span class="table-badge"><i class="fas fa-chair"></i> ${guest.table}</span>` : '-'}
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn-action" onclick="editGuest(${guest.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action" onclick="viewGuest(${guest.id})" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action delete" onclick="deleteGuest(${guest.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    renderPagination(filteredGuests.length);
}

function getFilteredGuests() {
    let filtered = [...guests];

    // Status filter
    const statusFilter = document.getElementById('statusFilter').value;
    if (statusFilter !== 'all') {
        filtered = filtered.filter(g => g.attendance === statusFilter);
    }

    // Meal filter
    const mealFilter = document.getElementById('mealFilter').value;
    if (mealFilter !== 'all') {
        filtered = filtered.filter(g => g.meal === mealFilter);
    }

    // Table filter
    const tableFilter = document.getElementById('tableFilter').value;
    if (tableFilter !== 'all') {
        if (tableFilter === 'unassigned') {
            filtered = filtered.filter(g => !g.table);
        } else {
            filtered = filtered.filter(g => g.table === tableFilter);
        }
    }

    // Search
    const searchTerm = document.getElementById('globalSearch').value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(g =>
            g.firstName.toLowerCase().includes(searchTerm) ||
            g.lastName.toLowerCase().includes(searchTerm) ||
            g.email.toLowerCase().includes(searchTerm)
        );
    }

    return filtered;
}

function filterGuests() {
    currentPage = 1;
    renderGuestTable();
}

function resetFilters() {
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('mealFilter').value = 'all';
    document.getElementById('tableFilter').value = 'all';
    document.getElementById('globalSearch').value = '';
    currentPage = 1;
    renderGuestTable();
}

function searchGuests(term) {
    currentPage = 1;
    renderGuestTable();
}

function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pagination = document.getElementById('pagination');

    let html = '';

    // Previous
    html += `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" onclick="changePage(${currentPage - 1})">
        <i class="fas fa-chevron-left"></i>
    </button>`;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span class="page-btn">...</span>`;
        }
    }

    // Next
    html += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" onclick="changePage(${currentPage + 1})">
        <i class="fas fa-chevron-right"></i>
    </button>`;

    pagination.innerHTML = html;
}

function changePage(page) {
    const totalPages = Math.ceil(getFilteredGuests().length / itemsPerPage);
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    renderGuestTable();

    // Scroll to top of table
    document.querySelector('.table-card').scrollIntoView({ behavior: 'smooth' });
}

function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.guest-checkbox');

    checkboxes.forEach(cb => {
        cb.checked = selectAll.checked;
    });
}

function executeBulkAction(action) {
    const selected = document.querySelectorAll('.guest-checkbox:checked');
    const ids = Array.from(selected).map(cb => parseInt(cb.value));

    if (ids.length === 0) {
        showToast('Please select guests first', 'warning');
        return;
    }

    switch (action) {
        case 'email':
            showToast(`Sending email to ${ids.length} guests...`, 'success');
            break;
        case 'reminder':
            showToast(`Sending reminder to ${ids.length} guests...`, 'success');
            break;
        case 'delete':
            if (confirm(`Delete ${ids.length} guests?`)) {
                guests = guests.filter(g => !ids.includes(g.id));
                renderGuestTable();
                updateAllStats();
                showToast(`${ids.length} guests deleted`, 'success');
            }
            break;
        case 'export':
            exportSelectedGuests(ids);
            break;
    }

    document.getElementById('bulkAction').value = '';
}


// ===================================
// GUEST MANAGEMENT (Updated)
// ===================================
async function loadGuests() {
    try {
        const data = await apiCall('/guests?page=' + currentPage);
        guests = data.guests || data;
        
        // Update all UI elements
        updateAllStats();
        renderGuestTable();
        renderRecentActivity();
        renderRSVPList();
        updateMealCounts();
        
        // Initialize charts on first load
        if (currentSection === 'overview') {
            initializeCharts();
        }
    } catch (error) {
        showToast('Failed to load guests', 'error');
        console.error('Error loading guests:', error);
    }
}

// Replace saveGuest with API version
async function saveGuest() {
    const form = document.getElementById('addGuestForm');
    const formData = new FormData(form);
    const guestData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        guestCount: parseInt(formData.get('guestCount'))
    };
    try {
        await apiCall('/guests', {
            method: 'POST',
            body: JSON.stringify(guestData)
        });
        bootstrap.Modal.getInstance(document.getElementById('addGuestModal')).hide();
        form.reset();
        loadGuests();
        showToast('Guest added successfully!', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Replace deleteGuest with API version
async function deleteGuest(id) {
    if (!confirm('Are you sure you want to delete this guest?')) return;
    try {
        await apiCall(`/guests/${id}`, { method: 'DELETE' });
        loadGuests();
        showToast('Guest deleted', 'success');
    } catch (error) {
        showToast('Failed to delete guest', 'error');
    }
}
if (!confirm('Are you sure you want to delete this guest?')) return;

guests = guests.filter(g => g.id !== id);
renderGuestTable();
updateAllStats();

showToast('Guest deleted successfully', 'success');


// ===================================
// MEAL MANAGEMENT
// ===================================
function updateMealCounts() {
    const meals = ['beef', 'chicken', 'fish', 'vegetarian', 'vegan'];
    const attending = guests.filter(g => g.attendance === 'yes');
    const totalMeals = attending.length;

    meals.forEach(meal => {
        const count = attending.filter(g => g.meal === meal).length;
        const percent = totalMeals > 0 ? Math.round((count / totalMeals) * 100) : 0;

        const countEl = document.getElementById(meal + 'Count');
        const percentEl = document.getElementById(meal + 'Percent');
        const barEl = document.getElementById(meal + 'Bar');

        if (countEl) {
            animateNumber(meal + 'Count', count);
            percentEl.textContent = percent + '%';
            barEl.style.width = percent + '%';
        }
    });

    // Dietary restrictions
    const dietaryCounts = {};
    attending.forEach(g => {
        g.dietary.forEach(d => {
            dietaryCounts[d] = (dietaryCounts[d] || 0) + 1;
        });
    });

    const dietaryContainer = document.getElementById('dietaryContainer');
    if (dietaryContainer) {
        if (Object.keys(dietaryCounts).length === 0) {
            dietaryContainer.innerHTML = '<p class="text-muted">No dietary restrictions recorded</p>';
        } else {
            dietaryContainer.innerHTML = Object.entries(dietaryCounts).map(([restriction, count]) => `
                <div class="dietary-tag-item">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>${restriction}</span>
                    <span class="dietary-count">${count}</span>
                </div>
            `).join('');
        }
    }
}

function getMealIcon(meal) {
    const icons = {
        beef: '🥩',
        chicken: '🍗',
        fish: '🐟',
        vegetarian: '🥗',
        vegan: '🌱'
    };
    return icons[meal] || '';
}

// ===================================
// RSVP MANAGEMENT
// ===================================
function renderRSVPList() {
    const rsvpList = document.getElementById('rsvpList');
    const recentRSVPs = guests
        .filter(g => g.date)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    if (recentRSVPs.length === 0) {
        rsvpList.innerHTML = '<p class="text-muted text-center">No RSVPs yet</p>';
        return;
    }

    rsvpList.innerHTML = recentRSVPs.map(guest => `
        <div class="rsvp-item">
            <div class="rsvp-guest">
                <div class="guest-avatar">${guest.firstName[0]}${guest.lastName[0]}</div>
                <div>
                    <div class="fw-bold">${guest.firstName} ${guest.lastName}</div>
                    <div class="rsvp-date"><i class="far fa-clock"></i> ${formatDate(guest.date)}</div>
                </div>
            </div>
            <span class="rsvp-status ${guest.attendance === 'yes' ? 'accepted' : 'declined'}">
                ${guest.attendance === 'yes' ? 'Accepted' : 'Declined'}
            </span>
        </div>
    `).join('');
}

function refreshRSVPs() {
    const icon = document.querySelector('.fa-sync-alt');
    icon.classList.add('fa-spin');

    setTimeout(() => {
        icon.classList.remove('fa-spin');
        renderRSVPList();
        showToast('RSVPs refreshed', 'success');
    }, 1000);
}

// ===================================
// ACTIVITY FEED
// ===================================
function renderRecentActivity() {
    const activities = [
        { type: 'rsvp', text: 'John Smith RSVP\'d Yes (+2 guests)', time: '2 minutes ago', icon: 'check', color: 'success' },
        { type: 'update', text: 'Meal preference updated for Sarah Johnson', time: '1 hour ago', icon: 'edit', color: 'info' },
        { type: 'message', text: 'New message from Michael Brown', time: '3 hours ago', icon: 'envelope', color: 'primary' },
        { type: 'rsvp', text: 'Emily Davis RSVP\'d Yes (+3 guests)', time: '5 hours ago', icon: 'check', color: 'success' },
        { type: 'update', text: 'Table assignment updated', time: '1 day ago', icon: 'chair', color: 'info' }
    ];

    const activityList = document.getElementById('activityList');
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.color}">
                <i class="fas fa-${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-text">${activity.text}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
        </div>
    `).join('');
}

function showAllActivity() {
    showToast('Full activity log coming soon', 'info');
}

// ===================================
// EXPORT & REPORTS
// ===================================
function exportData(format) {
    if (format === 'excel') {
        exportToExcel();
    } else if (format === 'pdf') {
        exportToPDF();
    }
}

function exportToExcel() {
    // Create CSV content
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Attendance', 'Guests', 'Meal', 'Table', 'Dietary', 'Notes'];
    const rows = guests.map(g => [
        g.firstName,
        g.lastName,
        g.email,
        g.phone,
        g.attendance,
        g.guestCount,
        g.meal,
        g.table,
        g.dietary.join(', '),
        g.notes
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

    downloadFile(csvContent, 'wedding-guests.csv', 'text/csv');
    showToast('Excel file downloaded!', 'success');
}

function exportToPDF() {
    showToast('PDF export started...', 'success');
    // Would use jsPDF or similar library in production
    setTimeout(() => {
        window.print();
    }, 500);
}

function exportSelectedGuests(ids) {
    // If no ids provided, take currently selected checkboxes
    if (!ids || !ids.length) {
        const selected = document.querySelectorAll('.guest-checkbox:checked');
        ids = Array.from(selected).map(cb => parseInt(cb.value));
    }

    if (!ids || ids.length === 0) {
        showToast('Please select guests first', 'warning');
        return;
    }

    const selectedGuests = guests.filter(g => ids.includes(g.id));

    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Attendance', 'Guests', 'Meal', 'Table'];
    const rows = selectedGuests.map(g => [
        g.firstName,
        g.lastName,
        g.email,
        g.phone,
        g.attendance,
        g.guestCount,
        g.meal,
        g.table
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

    downloadFile(csvContent, 'selected-guests.csv', 'text/csv');
    showToast(`${selectedGuests.length} guests exported!`, 'success');
}

function exportMealReport() {
    const meals = ['beef', 'chicken', 'fish', 'vegetarian', 'vegan'];
    const attending = guests.filter(g => g.attendance === 'yes');

    let report = 'Wedding Meal Report\n\n';
    report += `Total Attending: ${attending.length}\n`;
    report += `Generated: ${new Date().toLocaleString()}\n\n`;

    meals.forEach(meal => {
        const count = attending.filter(g => g.meal === meal).length;
        const percent = attending.length > 0 ? Math.round((count / attending.length) * 100) : 0;
        report += `${capitalize(meal)}: ${count} (${percent}%)\n`;
    });

    // Dietary restrictions summary
    report += '\nDietary Restrictions:\n';
    const dietaryCounts = {};
    attending.forEach(g => {
        (g.dietary || []).forEach(d => {
            dietaryCounts[d] = (dietaryCounts[d] || 0) + 1;
        });
    });

    if (Object.keys(dietaryCounts).length === 0) {
        report += 'None recorded\n';
    } else {
        Object.entries(dietaryCounts).forEach(([restriction, count]) => {
            report += `${restriction}: ${count}\n`;
        });
    }

    downloadFile(report, 'meal-report.txt', 'text/plain');
    showToast('Meal report downloaded!', 'success');
}

function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// ===================================
// QUICK ACTIONS
// ===================================
function sendBulkEmail() {
    showToast('Email composer opening...', 'info');
    // Would open email modal in production
}

function printNameCards() {
    showToast('Preparing name cards for print...', 'success');
    setTimeout(() => {
        window.print();
    }, 1000);
}

function addTable() {
    showToast('Table planner coming soon!', 'info');
}

function showImportModal() {
    showToast('Import feature coming soon!', 'info');
}

function addAdminUser() {
    const email = prompt('Enter new admin email:');
    if (email && validateEmail(email)) {
        showToast(`Invitation sent to ${email}`, 'success');
    } else if (email) {
        showToast('Please enter a valid email', 'error');
    }
}

// ===================================
// NOTIFICATIONS & TOASTS
// ===================================
function showToast(message, type = 'info') {
    // Remove existing toasts
    const existing = document.querySelector('.toast-container');
    if (existing) existing.remove();

    // Create toast container
    const container = document.createElement('div');
    container.className = 'toast-container';

    // Icon based on type
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };

    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };

    container.innerHTML = `
        <div class="toast ${type}">
            <i class="fas fa-${icons[type]}" style="color: ${colors[type]}; font-size: 1.5rem;"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(container);

    // Remove after 3 seconds
    setTimeout(() => {
        container.style.opacity = '0';
        container.style.transform = 'translateX(100%)';
        setTimeout(() => container.remove(), 300);
    }, 3000);
}

function showNotifications() {
    showToast('No new notifications', 'info');
}

// ===================================
// REFRESH DATA
// ===================================
function refreshData() {
    const icon = document.getElementById('refreshIcon');
    if (icon) icon.classList.add('fa-spin');

    // Simulate data refresh
    setTimeout(() => {
        if (icon) icon.classList.remove('fa-spin');
        updateAllStats();
        renderGuestTable();
        renderRSVPList();
        showToast('Data refreshed!', 'success');
    }, 1500);
}

// ===================================
// UTILITY FUNCTIONS
// ===================================
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function updateCurrentDate() {
    const dateEl = document.getElementById('currentDate');
    if (!dateEl) return;
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = new Date().toLocaleDateString('en-US', options);
}

// ===================================
// KEYBOARD SHORTCUTS
// ===================================
document.addEventListener('keydown', function (e) {
    // Ctrl/Cmd + R for refresh
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        refreshData();
    }

    // Escape to close modals
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            try {
                bootstrap.Modal.getInstance(modal).hide();
            } catch (err) { }
        });
    }

    // Ctrl/Cmd + F for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const gs = document.getElementById('globalSearch');
        if (gs) gs.focus();
    }
});

// ===================================
// WINDOW RESIZE HANDLER
// ===================================
window.addEventListener('resize', function () {
    if (window.innerWidth >= 992) {
        const sb = document.getElementById('sidebar');
        if (sb) sb.classList.remove('show');
    }

    // Resize charts
    Object.values(charts).forEach(chart => {
        if (chart && chart.resize) chart.resize();
    });
});

// ===================================
// BEFORE UNLOAD - SAVE STATE
// ===================================
window.addEventListener('beforeunload', function () {
    // Save current state to sessionStorage
    try {
        sessionStorage.setItem('weddingAdminState', JSON.stringify({
            currentSection: currentSection,
            currentPage: currentPage,
            filters: {
                status: document.getElementById('statusFilter')?.value,
                meal: document.getElementById('mealFilter')?.value,
                table: document.getElementById('tableFilter')?.value
            }
        }));
    } catch (err) { }
});

// Console greeting
console.log('%c👰🤵 Wedding Admin Dashboard', 'color: #9CAF88; font-size: 20px; font-weight: bold;');
console.log('%cBuilt with love for Sarah & Michael', 'color: #D4AF37; font-size: 14px;');
console.log('%cShortcuts: Ctrl+R (Refresh) | Ctrl+F (Search) | Esc (Close modals)', 'color: #7A8F6A; font-size: 12px;');