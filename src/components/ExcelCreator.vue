<template>
  <div class="excel-creator">
    <h2>Tạo File Excel Mới</h2>
    
    <form @submit.prevent="createExcel" class="create-form">
      <div class="form-group">
        <label for="filename">Tên File:</label>
        <input 
          type="text" 
          id="filename" 
          v-model="filename" 
          placeholder="Nhập tên file Excel"
          required
        />
      </div>

      <div class="form-group">
        <label for="sheets">Số lượng Sheet:</label>
        <input 
          type="number" 
          id="sheets" 
          v-model="numberOfSheets" 
          min="1" 
          max="10"
          required
        />
      </div>

      <div class="form-group">
        <label for="rows">Số hàng mặc định:</label>
        <input 
          type="number" 
          id="rows" 
          v-model="defaultRows" 
          min="1" 
          max="1000"
          required
        />
      </div>

      <div class="form-group">
        <label for="columns">Số cột mặc định:</label>
        <input 
          type="number" 
          id="columns" 
          v-model="defaultColumns" 
          min="1" 
          max="100"
          required
        />
      </div>

      <button type="submit" class="create-btn">Tạo File Excel</button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const filename = ref('')
const numberOfSheets = ref(1)
const defaultRows = ref(50)
const defaultColumns = ref(26)

// Tạo cấu trúc sheet mới
const createNewSheet = (index) => {
  return {
    name: `Sheet${index + 1}`, // Tên sheet
    color: "", // Màu sheet
    index: index, // Index của sheet
    status: 1, // Trạng thái sheet
    order: index, // Thứ tự sheet
    celldata: [], // Dữ liệu các cell
    config: {
      merge: {}, // Cấu hình merge cells
      rowlen: {}, // Độ cao hàng
      columnlen: {}, // Độ rộng cột
      rowhidden: {}, // Ẩn/hiện hàng
      colhidden: {}, // Ẩn/hiện cột
      borderInfo: [], // Thông tin border
    },
    scrollLeft: 0, // Vị trí cuộn ngang
    scrollTop: 0, // Vị trí cuộn dọc
    luckysheet_select_save: [], // Vùng được chọn
    calcChain: [], // Công thức
    isPivotTable: false, // Có phải là pivot table
    pivotTable: {}, // Cấu hình pivot table
    filter_select: {}, // Bộ lọc
    filter: null, // Điều kiện lọc
    luckysheet_alternateformat_save: [], // Định dạng có điều kiện
    luckysheet_alternateformat_save_modelCustom: [], // Định dạng có điều kiện tùy chỉnh
    luckysheet_conditionformat_save: {}, // Định dạng có điều kiện
    frozen: {}, // Đóng băng ô
    chart: [], // Biểu đồ
    zoomRatio: 1, // Tỷ lệ zoom
    image: [], // Hình ảnh
    showGridLines: 1, // Hiển thị đường lưới
  }
}

const createExcel = () => {
  // Tạo mảng chứa các sheets
  const sheets = []
  
  // Tạo số lượng sheet theo input
  for (let i = 0; i < numberOfSheets.value; i++) {
    sheets.push(createNewSheet(i))
  }

  // Tạo cấu trúc file Excel
  const excelData = {
    info: {
      name: filename.value,
      creator: 'ExcelCreator',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    },
    sheets: sheets
  }

  // Chuyển hướng đến LuckySheet với data mới tạo
  router.push({
    name: 'editor',
    query: { 
      new: 'true'
    },
    state: { excelData }
  })
}
</script>

<style scoped>
.excel-creator {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

label {
  font-weight: bold;
  text-align: left;
}

input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.create-btn {
  background-color: #4CAF50;
  color: white;
  padding: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.create-btn:hover {
  background-color: #45a049;
}
</style>
