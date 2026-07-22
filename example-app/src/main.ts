// runtime импортируется ПЕРВЫМ — детекция SmartNet до создания приложения.
import './smartnet/runtime'
import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

createApp(App).mount('#app')
