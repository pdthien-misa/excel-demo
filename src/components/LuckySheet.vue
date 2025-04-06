<template>
  <div style="position: absolute; top: 0">
    <input id="uploadBtn" type="file" @change="loadExcel" />
    <span>Or Load remote xlsx file:</span>
    <select v-model="selected" @change="selectExcel">
      <option disabled value="">Choose</option>
      <option v-for="option in options" :key="option.text" :value="option.value">
        {{ option.text }}
      </option>
    </select>
    <a href="javascript:void(0)" @click="downloadExcel">Download source xlsx file</a>
  </div>
  <div id="luckysheet"></div>
  <div v-show="isMaskShow" id="tip">Downloading</div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { exportExcel } from '../utils/export'
import { isFunction } from '../utils/is'
import LuckyExcel from 'luckyexcel'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

// Reactive state
const isMaskShow = ref(false)
const selected = ref('')
const jsonData = ref({})
const options = ref([
  { text: 'Money Manager.xlsx', value: 'https://minio.cnbabylon.com/public/luckysheet/money-manager-2.xlsx' },
  { text: 'Activity costs tracker.xlsx', value: 'https://minio.cnbabylon.com/public/luckysheet/Activity%20costs%20tracker.xlsx' },
  { text: 'House cleaning checklist.xlsx', value: 'https://minio.cnbabylon.com/public/luckysheet/House%20cleaning%20checklist.xlsx' },
  { text: 'Student assignment planner.xlsx', value: 'https://minio.cnbabylon.com/public/luckysheet/Student%20assignment%20planner.xlsx' },
  { text: 'Credit card tracker.xlsx', value: 'https://minio.cnbabylon.com/public/luckysheet/Credit%20card%20tracker.xlsx' },
  { text: 'Blue timesheet.xlsx', value: 'https://minio.cnbabylon.com/public/luckysheet/Blue%20timesheet.xlsx' },
  { text: 'Student calendar (Mon).xlsx', value: 'https://minio.cnbabylon.com/public/luckysheet/Student%20calendar%20%28Mon%29.xlsx' },
  { text: 'Blue mileage and expense report.xlsx', value: 'https://minio.cnbabylon.com/public/luckysheet/Blue%20mileage%20and%20expense%20report.xlsx' },
])

// Yjs setup
const ydoc = new Y.Doc()
const wsProvider = new WebsocketProvider('ws://localhost:3001', 'luckysheet-demo', ydoc)
const sharedData = ydoc.getMap('luckysheet')

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
    const currentSheets = sharedData.get('sheets')
    // Avoid unnecessary updates to prevent infinite loops
    if (JSON.stringify(sheets) !== JSON.stringify(currentSheets)) {
      ydoc.transact(() => {
        sharedData.set('sheets', sheets)
      })
    }
  }
}

// Update LuckySheet from Yjs data
const updateFromYJS = () => {
  const sheets = sharedData.get('sheets') || defaultSheet
  if (sheets && window.luckysheet) {
    const currentSheets = window.luckysheet.getAllSheets()
    if (JSON.stringify(sheets) !== JSON.stringify(currentSheets)) {
      isFunction(window.luckysheet.destroy) && window.luckysheet.destroy()
      window.luckysheet.create({
        container: 'luckysheet',
        showinfobar: false,
        data: sheets,
        title: jsonData.value.info?.name || 'Collaborative Sheet',
        userInfo: jsonData.value.info?.name?.creator || 'User',
        hook: {
          cellUpdateEdit: syncToYJS,
          cellUpdated: syncToYJS,
          sheetCreateAfter: syncToYJS,
          sheetDeleted: syncToYJS,
        },
      })
    }
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
        cellUpdateEdit: syncToYJS,
        cellUpdated: syncToYJS,
        sheetCreateAfter: syncToYJS,
        sheetDeleted: syncToYJS,
      },
    })
    syncToYJS() // Sync to Yjs after creation
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
        cellUpdateEdit: syncToYJS,
        cellUpdated: syncToYJS,
        sheetCreateAfter: syncToYJS,
        sheetDeleted: syncToYJS,
      },
    })
    syncToYJS() // Sync to Yjs after creation
  })
}

const downloadExcel = () => {
  exportExcel(sharedData.get('sheets') || window.luckysheet.getAllSheets(), '下载')
}

onMounted(() => {
  wsProvider.on('status', (event) => {
    if (event.status === 'connected') {
      const sheets = sharedData.get('sheets') || defaultSheet
      window.luckysheet.create({
        container: 'luckysheet',
        showinfobar: false,
        data: sheets,
        hook: {
          cellUpdateEdit: syncToYJS,
          cellUpdated: syncToYJS,
          sheetCreateAfter: syncToYJS,
          sheetDeleted: syncToYJS,
        },
      })
    }
  })

  // Observe Yjs changes
  sharedData.observe(() => {
    updateFromYJS()
  })
})

onUnmounted(() => {
  wsProvider.destroy()
  ydoc.destroy()
  isFunction(window?.luckysheet?.destroy) && window.luckysheet.destroy()
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