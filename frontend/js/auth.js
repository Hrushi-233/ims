import api from './api.js';

const auth = {
    async login(email, password) {
        try {
            const data = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return data.user;
        } catch (error) {
            throw error;
        }
    },

    async signup(name, email, password) {
        try {
            await api.post('/auth/signup', { name, email, password });
        } catch (error) {
            throw error;
        }
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    },

    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated() {
        return !!localStorage.getItem('token');
    },

    checkAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'login.html';
        }
    }
};

export default auth;
