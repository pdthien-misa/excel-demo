<template>
  <div style="position: absolute; top: 0">
    <input id="uploadBtn" type="file" @change="loadExcel" />
   
    <a href="javascript:void(0)" @click="downloadExcel">Download source xlsx file</a>
  </div>
  <div id="luckysheet"></div>
  <div v-show="isMaskShow" id="tip">Downloading</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { exportExcel } from '../utils/export'
import { isFunction } from '../utils/is'
import LuckyExcel from 'luckyexcel'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

// Reactive state
const isMaskShow = ref(false)
const selected = ref('')
const jsonData = ref({})

// Yjs setup cho mỗi file
const route = useRoute()
const fileId = route.query.id || 'default'
const roomName = `file_${fileId}`

const ydoc = new Y.Doc()
const wsProvider = new WebsocketProvider('ws://localhost:3001', roomName, ydoc)
const sharedData = ydoc.getMap('sheets')

// Default sheet for initial load
const defaultSheet = [{
  name: 'Sheet1',
  index: 'sheet_001',
  data: [[]],
  config: {},
  status: 1,
  order: 0,
}]

// Sync local LuckySheet changes to Yjs
const syncToYJS = () => {
  if (window.luckysheet) {
    const sheets = window.luckysheet.getAllSheets()
    if (JSON.stringify(sheets) !== JSON.stringify(sharedData.get('data'))) {
      // Cập nhật sheets trong YJS của file hiện tại
      sharedData.set('data', sheets)
      
      // Cập nhật thời gian sửa đổi của file trong danh sách files
      const filesDoc = new Y.Doc()
      const filesProvider = new WebsocketProvider('ws://localhost:3001', 'excel-files', filesDoc)
      const filesMap = filesDoc.getMap('files')
      
      const currentFile = filesMap.get(fileId)
      if (currentFile) {
        currentFile.modified = new Date().toISOString()
        currentFile.sheets = sheets
        filesMap.set(fileId, currentFile)
      }
      
      filesProvider.destroy()
      filesDoc.destroy()
    }
  }
}

// Update LuckySheet from Yjs data
const updateFromYJS = () => {
  const sheets = sharedData.get('data')
  if (!sheets || !window.luckysheet) return

  const currentSheets = window.luckysheet.getAllSheets()
  
  // Nếu có sự thay đổi về cấu trúc sheet hoặc dữ liệu
  if (JSON.stringify(currentSheets) !== JSON.stringify(sheets)) {
    isFunction(window.luckysheet.destroy) && window.luckysheet.destroy()
    
    window.luckysheet.create({
      container: 'luckysheet',
      showinfobar: false,
      data: sheets,
      hook: {
        cellUpdateEdit: syncToYJS,
        cellUpdated: syncToYJS,
        sheetCreateAfter: syncToYJS,
        sheetDeleted: syncToYJS,
      }
    })
  }
}

const loadExcel = (evt) => {
  const files = evt.target.files
  if (!files || files.length === 0) {
    alert('No files wait for import')
    return
  }

  const name = files[0].name
  const suffixArr = name.split('.')
  const suffix = suffixArr[suffixArr.length - 1]
  if (suffix !== 'xlsx') {
    alert('Currently only supports the import of xlsx files')
    return
  }

  LuckyExcel.transformExcelToLucky(files[0], (exportJson) => {
    if (!exportJson.sheets || exportJson.sheets.length === 0) {
      alert('Failed to read the content of the excel file, currently does not support xls files!')
      return
    }
    jsonData.value = exportJson
    isFunction(window?.luckysheet?.destroy) && window.luckysheet.destroy()
    window.luckysheet.create({
      container: 'luckysheet',
      showinfobar: false,
      data: exportJson.sheets,
      title: exportJson.info.name,
      userInfo: exportJson.info.name.creator,
      hook: {
        sheetCreateAfter: syncToYJS,
        sheetDeleted: syncToYJS,
        updated: syncToYJS, // Added to catch general updates
      },
    })
    syncToYJS()
  })
}

const selectExcel = (evt) => {
  const value = selected.value
  const name = evt.target.options[evt.target.selectedIndex].innerText

  if (!value) return

  isMaskShow.value = true

  LuckyExcel.transformExcelToLuckyByUrl(value, name, (exportJson) => {
    if (!exportJson.sheets || exportJson.sheets.length === 0) {
      alert('Failed to read the content of the excel file, currently does not support xls files!')
      return
    }
    jsonData.value = exportJson
    isMaskShow.value = false
    isFunction(window?.luckysheet?.destroy) && window.luckysheet.destroy()
    window.luckysheet.create({
      container: 'luckysheet',
      showinfobar: false,
      data: exportJson.sheets,
      title: exportJson.info.name,
      userInfo: exportJson.info.name.creator,
      hook: {
        sheetCreateAfter: syncToYJS,
        sheetDeleted: syncToYJS,
        updated: syncToYJS, // Added to catch general updates
      },
    })
    syncToYJS()
  })
}

const downloadExcel = () => {
  const fileName = route.state?.excelData?.name || 'spreadsheet'
  exportExcel(window.luckysheet.getAllSheets(), fileName)
}

onMounted(() => {
  // Theo dõi kết nối websocket
  wsProvider.on('status', ({ status }) => {
    if (status === 'connected') {
      // Khởi tạo data từ route state hoặc YJS
      const routeState = route.state?.excelData
      console.log('routeState', routeState)
      if (routeState) {
        // Nếu là file mới hoặc được mở từ danh sách
        window.luckysheet.create({
          container: 'luckysheet',
          showinfobar: false,
          data: routeState.sheets,
          title: routeState.name,
          hook: {
            cellUpdateEdit: syncToYJS,
            cellUpdated: syncToYJS,
            sheetCreateAfter: syncToYJS,
            sheetDeleted: syncToYJS,
          }
        })
        
        // Lưu vào YJS cho việc đồng bộ
        sharedData.set('data', routeState.sheets)
      } else {
        // Lấy data từ YJS nếu có
        const sheets = sharedData.get('data')
        window.luckysheet.create({
          container: 'luckysheet',
          showinfobar: false,
          data: sheets,
          title: 'Spreadsheet',
          hook: {
            cellUpdateEdit: syncToYJS,
            cellUpdated: syncToYJS,
            sheetCreateAfter: syncToYJS,
            sheetDeleted: syncToYJS,
          }
        })
      }
    }
  })

  // Theo dõi thay đổi từ YJS
  sharedData.observe(() => {
    const sheets = sharedData.get('data')
    if (sheets) {
      updateFromYJS()
    }
  })
})

onUnmounted(() => {
  if (wsProvider) {
    wsProvider.destroy()
  }
  if (ydoc) {
    ydoc.destroy()
  }
  if (window.luckysheet && isFunction(window.luckysheet.destroy)) {
    window.luckysheet.destroy()
  }
})
</script>

<style scoped>
#luckysheet {
  margin: 0px;
  padding: 0px;
  position: absolute;
  width: 100%;
  left: 0px;
  top: 30px;
  bottom: 0px;
}

#uploadBtn {
  font-size: 16px;
}

#tip {
  position: absolute;
  z-index: 1000000;
  left: 0px;
  top: 0px;
  bottom: 0px;
  right: 0px;
  background: rgba(255, 255, 255, 0.8);
  text-align: center;
  font-size: 40px;
  align-items: center;
  justify-content: center;
  display: flex;
}
</style>
