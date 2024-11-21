document.addEventListener('DOMContentLoaded', () => {
	const dropZone = document.getElementById('drop-zone')
	const fileInput = document.getElementById('file-input')
	const transactionsTable = document.getElementById('transactions-table')
	const startDateInput = document.getElementById('start-date')
	const endDateInput = document.getElementById('end-date')
	const searchStockInput = document.getElementById('search-stock')

	const sumDisplay = document.getElementById('sum-display')
	const clearButton = document.getElementById('clear-button')

	clearButton.addEventListener('click', () => {
		const selectedCells = document.querySelectorAll('.selected-cell')
		selectedCells.forEach(cell => {
			cell.classList.remove('selected-cell')
		})
		sumDisplay.textContent = 'Sum: 0.00'
	})

	let transactionData = []

	dropZone.addEventListener('dragover', e => {
		e.preventDefault()
		dropZone.classList.add('hover')
	})

	dropZone.addEventListener('dragleave', () => {
		dropZone.classList.remove('hover')
	})

	dropZone.addEventListener('drop', e => {
		e.preventDefault()
		dropZone.classList.remove('hover')
		const files = e.dataTransfer.files
		if (files.length) {
			handleFile(files[0])
		}
	})

	fileInput.addEventListener('change', e => {
		if (e.target.files.length) {
			handleFile(e.target.files[0])
		}
	})

	function handleFile(file) {
		const reader = new FileReader()
		reader.onload = e => {
			const text = e.target.result
			transactionData = parseCSV(text)
			displayTransactions(transactionData)
		}
		reader.readAsText(file)
	}

	function parseCSV(text) {
		const rows = text.split('\n')
		const headers = rows[0].split(';')
		const data = rows
			.slice(1)
			.map(row => {
				const values = row.split(';')
				let entry = {}
				headers.forEach((header, index) => {
					let value = values[index] ? values[index].trim() : ''
					if (['shares', 'price', 'amount', 'fee', 'tax'].includes(header.trim().toLowerCase())) {
						value = parseFloat(value.replace('.', '').replace(',', '.'))
					}
					entry[header.trim()] = value
				})
				if (entry['type']) {
					if (entry['type'].toLowerCase() === 'buy') {
						entry['shares'] = Math.abs(entry['shares'] || 0)
					} else if (entry['type'].toLowerCase() === 'sell') {
						entry['shares'] = -Math.abs(entry['shares'] || 0)
					}
				}
				return entry
			})
			.filter(entry => entry['status'] === 'Executed' && (entry['type'] === 'Buy' || entry['type'] === 'Sell'))

		return data
	}

	function displayTransactions(data) {
		let filteredData = filterData(data)
		transactionsTable.innerHTML = generateTableHTML(filteredData)
		attachCellSelectEvent()
	}

	function filterData(data) {
		let filteredData = data
		const startDate = startDateInput.value
		const endDate = endDateInput.value
		const searchStock = searchStockInput.value.toLowerCase()

		if (startDate) {
			filteredData = filteredData.filter(entry => new Date(entry.date.split('.').reverse().join('-')) >= new Date(startDate))
		}
		if (endDate) {
			filteredData = filteredData.filter(entry => new Date(entry.date.split('.').reverse().join('-')) <= new Date(endDate))
		}
		if (searchStock) {
			filteredData = filteredData.filter(entry => entry.description.toLowerCase().includes(searchStock))
		}

		return filteredData
	}

	function generateTableHTML(data) {
		let html = ''
		let groupedData = groupBy(data, 'date')
		Object.keys(groupedData)
			.sort((a, b) => new Date(b.split('.').reverse().join('-')) - new Date(a.split('.').reverse().join('-')))
			.forEach(date => {
				html += `<h3 class="date-header">${date}</h3>`
				html += '<table class="table">'
				html += `<thead><tr><th>Stock</th><th>Type</th><th>Shares</th><th>Price</th><th>Amount</th><th class='extra-column'>Notes</th></tr></thead><tbody>`
				let previousStock = null
				groupedData[date]
					.sort((a, b) => a.description.localeCompare(b.description))
					.forEach(entry => {
						const rowClass = entry.type.toLowerCase() === 'buy' ? 'buy' : 'sell'
						const borderBottomStyle = previousStock && previousStock !== entry.description ? 'border-top: 3px solid #000;' : ''
						html += `<tr class="${rowClass}" style="${borderBottomStyle}"><td>${entry.description.replace(/['"]+/g, '')}</td><td>${
							entry.type
						}</td><td class="selectable">${entry.shares.toFixed(1)}</td><td class="selectable">${entry.price.toFixed(
							1,
						)}</td><td class="selectable bold">${entry.amount.toFixed(1)}</td><td class='extra-column'></td></tr>`
						previousStock = entry.description
					})
				html += '</tbody></table>'
			})
		return html
	}

	function groupBy(data, key) {
		return data.reduce((result, item) => {
			;(result[item[key]] = result[item[key]] || []).push(item)
			return result
		}, {})
	}

	function attachCellSelectEvent() {
		const cells = document.querySelectorAll('.table td.selectable')
		cells.forEach(cell => {
			cell.addEventListener('click', () => {
				cell.classList.toggle('selected-cell')
				showSumDisplay()
			})
		})
	}

	function showSumDisplay() {
		const selectedCells = document.querySelectorAll('.selected-cell')
		let sum = 0
		if (selectedCells.length > 0) {
			selectedCells.forEach(cell => {
				sum += parseFloat(cell.textContent)
			})
			sumDisplay.textContent = `Sum: ${sum.toFixed(2)}`
		} else {
			sumDisplay.textContent = 'Sum: 0.00'
		}
	}

	startDateInput.addEventListener('change', () => displayTransactions(filterData(transactionData)))
	endDateInput.addEventListener('change', () => displayTransactions(filterData(transactionData)))
	searchStockInput.addEventListener('input', () => displayTransactions(filterData(transactionData)))
})

document.addEventListener('DOMContentLoaded', () => {
	document.getElementById('print-button').addEventListener('click', () => {
		const printContents = document.querySelectorAll('.date-header, .table')
		let printHTML = ''

		// Collect the content to print
		printContents.forEach(element => {
			printHTML += element.outerHTML
		})

		// Open a new window for the print content
		const printWindow = window.open('', '_blank')
		printWindow.document.write(`
          <html>
              <head>
                  <title>Print Report</title>
                  <style>
                      body {
                          font-family: Arial, sans-serif;
                          margin: 20px;
                      }
                      .table {
                          width: 100%;
                          border-collapse: collapse;
                          margin-bottom: 20px;
                          border: 1px solid #000;
                      }
                      .table th, .table td {
                          padding: 12px;
                          border: 1px solid #000;
                          text-align: left;
                          font-size: 14px;
                          color: #000;
                      }
                      .table th {
                          background-color: #f1f1f1;
                          color: #000;
                          font-weight: bold;
                      }
                      .table td:last-child {
                          border-right: 1px solid #000;
                          width: 100px; /* Empty space for notes */
                      }
                      .date-header {
                          text-align: center;
                          font-size: 36px;
                          color: #000;
                          font-weight: bold;
                          margin-top: 40px;
                          margin-bottom: 20px;
                      }
                  </style>
              </head>
              <body>
                  ${printHTML}
              </body>
          </html>
      `)
		printWindow.document.close()
		printWindow.print()
	})
})

