<template>
  <div class="file-manager">
    <div class="header">
      <h2>Danh sách Files</h2>
      <button class="create-btn" @click="showCreatePopup = true">+ Tạo file mới</button>
    </div>

    <div class="files-list">
      <div v-for="file in files" :key="file.id" class="file-item">
        <div class="file-info">
          <span class="file-name">{{ file.name }}</span>
          <span class="file-date">{{ new Date(file.modified).toLocaleString() }}</span>
        </div>
        <div class="file-actions">
          <button class="edit-btn" @click="openFile(file)">Chỉnh sửa</button>
        </div>
      </div>
      <div v-if="!files.length" class="no-files">
        Chưa có file nào. Hãy tạo file mới!
      </div>
    </div>

    <!-- Create File Popup -->
    <div v-if="showCreatePopup" class="popup-overlay">
      <div class="popup">
        <h3>Tạo File Excel Mới</h3>
        <input 
          v-model="newFileName" 
          type="text" 
          placeholder="Nhập tên file"
          @keyup.enter="createFile"
        >
        <div class="popup-actions">
          <button class="cancel-btn" @click="showCreatePopup = false">Hủy</button>
          <button class="confirm-btn" @click="createFile">Tạo</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

const router = useRouter()
const showCreatePopup = ref(false)
const newFileName = ref('')
const files = ref([])

// Khởi tạo YJS document để lưu trữ danh sách files
const ydoc = new Y.Doc()
const wsProvider = new WebsocketProvider('ws://localhost:3001', 'excel-files', ydoc)
const filesMap = ydoc.getMap('files')

// Lắng nghe thay đổi từ YJS
onMounted(() => {
  // Khởi tạo danh sách files từ YJS
  files.value = Array.from(filesMap.values())

  // Lắng nghe sự thay đổi
  filesMap.observe(() => {
    files.value = Array.from(filesMap.values())
  })
})

// Hàm tạo file mới
const createFile = () => {
  if (!newFileName.value.trim()) {
    alert('Vui lòng nhập tên file!')
    return
  }

  const newFile = {
    id: Date.now().toString(),
    name: newFileName.value.trim(),
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    sheets: [{
      name: 'Sheet1',
      index: 0,
      status: 1,
      order: 0,
      celldata: [],
      config: {}
    }]
  }

  // Lưu file mới vào YJS
  filesMap.set(newFile.id, newFile)

  // Reset và đóng popup
  newFileName.value = ''
  showCreatePopup.value = false

  // Chuyển đến trang editor
  router.push({
    name: 'editor',
    query: { id: newFile.id },
    state: { excelData: newFile }
  })
}

// Mở file để chỉnh sửa
const openFile = (file) => {
  router.push({
    name: 'editor',
    query: { id: file.id },
    state: { excelData: file }
  })
}
</script>

<style scoped>
.file-manager {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.create-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.create-btn:hover {
  background-color: #45a049;
}

.files-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.file-item:last-child {
  border-bottom: none;
}

.file-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.file-name {
  font-weight: 500;
  color: #2c3e50;
}

.file-date {
  font-size: 12px;
  color: #666;
}

.edit-btn {
  background-color: #2196F3;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.edit-btn:hover {
  background-color: #1976D2;
}

.no-files {
  padding: 40px;
  text-align: center;
  color: #666;
}

/* Popup styles */
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.popup {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
}

.popup h3 {
  margin-bottom: 20px;
}

.popup input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 20px;
}

.popup-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-btn {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-btn {
  padding: 8px 16px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.confirm-btn:hover {
  background: #45a049;
}
</style>
