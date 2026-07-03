
const API_URL = '/api';
let currentUserRole = null;

document.addEventListener('DOMContentLoaded', () => {

    document.getElementById('login-form').addEventListener('submit', handleLogin);

    document.getElementById('sale-form').addEventListener('submit', processSale);
    document.getElementById('add-phone-form').addEventListener('submit', addNewSmartphone);
    document.getElementById('supplier-form').addEventListener('submit', addNewSupplier); 
});


async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('loginUser').value;
    const password = document.getElementById('loginPass').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const data = await response.json();
            currentUserRole = data.role; 
    
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('main-dashboard').style.display = 'block';
            
            alert(`Welcome ${data.username}! Logged in as: ${data.role}`);
            
           
            fetchInventory();
            fetchAnalytics();
            fetchSuppliers();
            enforceSecurityRoles();
        } else {
            alert('Access Denied: Invalid credentials.');
        }
    } catch (error) {
        console.error('Login error:', error);
    }
}

function enforceSecurityRoles() {

    if (currentUserRole === 'CASHIER') {
      
        document.getElementById('add-phone-form').parentElement.style.display = 'none';
        document.getElementById('supplier-form').parentElement.style.display = 'none';
    }
}

async function fetchInventory() {
    try {
        const response = await fetch(`${API_URL}/inventory`);
        const smartphones = await response.json();
        
        const tbody = document.querySelector('#inventory-table tbody');
        tbody.innerHTML = ''; 

        smartphones.forEach(phone => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${phone.PHONE_ID}</td>
                <td><strong>${phone.BRAND}</strong></td>
                <td>${phone.MODEL}</td>
                <td>$${phone.PRICE.toFixed(2)}</td>
                <td>${phone.STOCK_QUANTITY} units</td>
                <td>${phone.SUPPLIER_NAME || 'N/A'}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching inventory:', error);
    }
}

async function fetchAnalytics() {
    try {
        const response = await fetch(`${API_URL}/analytics/stock-value`);
        const analyticsData = await response.json();
        
        const container = document.getElementById('analytics-container');
        container.innerHTML = ''; 

        if(analyticsData.length === 0) {
            container.innerHTML = '<p>No data available yet.</p>';
            return;
        }

        analyticsData.forEach(brandData => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3>${brandData.BRAND} Stock Value</h3>
                <p>$${brandData.TOTAL_VALUE.toLocaleString()}</p>
                <small style="color: #64748b;">Quantity: ${brandData.TOTAL_PHONES} units</small>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
    }
}


async function fetchSuppliers() {
    try {
        const response = await fetch(`${API_URL}/suppliers`);
        const suppliers = await response.json();
        
        const dropdown = document.getElementById('supplierId');
        dropdown.innerHTML = '<option value="">-- Select a Supplier --</option>'; // Clear default

        suppliers.forEach(sup => {
            const option = document.createElement('option');
            option.value = sup.SUPPLIER_ID;
            option.textContent = `${sup.SUPPLIER_NAME}`; 
            dropdown.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching suppliers:', error);
    }
}

async function addNewSmartphone(event) {
    event.preventDefault(); 

    const brand = document.getElementById('brand').value;
    const model = document.getElementById('model').value;
    const price = parseFloat(document.getElementById('price').value);
    const stock = parseInt(document.getElementById('stock').value);
    const supplier_id = parseInt(document.getElementById('supplierId').value);

    try {
        const response = await fetch(`${API_URL}/inventory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brand, model, price, stock, supplier_id })
        });

        if (response.ok) {
            alert('Smartphone added successfully!');
            document.getElementById('add-phone-form').reset(); // Clear input boxes
            
          
            fetchInventory();
            fetchAnalytics();
        } else {
            const errorData = await response.json();
            alert(`Failed to add smartphone: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Error submitting smartphone data:', error);
        alert('Server communication error.');
    }
}


async function processSale(event) {
    event.preventDefault(); 

    const phone_id = parseInt(document.getElementById('salePhoneId').value);
    const quantity = parseInt(document.getElementById('saleQuantity').value);

    try {
        const response = await fetch(`${API_URL}/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone_id, quantity })
        });

        if (response.ok) {
            alert('Transaction complete! Stock has been updated.');
            document.getElementById('sale-form').reset();
            
        
            fetchInventory();
            fetchAnalytics();
        } else {
            const errorData = await response.json();
            alert(`Sale Failed: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Error processing sale:', error);
        alert('Server communication error.');
    }
}


async function addNewSupplier(event) {
    event.preventDefault();

    const name = document.getElementById('supName').value;
    const email = document.getElementById('supEmail').value;
    const phone = document.getElementById('supPhone').value;

    try {
        const response = await fetch(`${API_URL}/suppliers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone })
        });

        if (response.ok) {
            alert('Supplier added successfully!');
            document.getElementById('supplier-form').reset();
            fetchSuppliers();
        } else {
            const errorData = await response.json();
            alert(`Failed to add supplier: ${errorData.error}`);
        }
    } catch (error) {
        console.error('Error submitting supplier:', error);
    }
}

async function fetchPremiumPhones() {
    const tbody = document.querySelector('#premium-table tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748b;">Loading...</td></tr>';

    try {
        const response = await fetch(`${API_URL}/inventory/premium`);
        const data = await response.json();

        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748b;">No premium phones found.</td></tr>';
            return;
        }

        data.forEach(phone => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${phone.PHONE_ID}</td>
                <td><strong>${phone.BRAND}</strong></td>
                <td>${phone.MODEL}</td>
                <td style="font-weight: 600; color: #3b82f6;">$${phone.PRICE.toFixed(2)}</td>
                <td>${phone.STOCK_QUANTITY} units</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Failed to load data.</td></tr>';
        console.error('Error fetching premium phones:', error);
    }
}


async function fetchBrandReport() {
    const brand = document.getElementById('reportBrand').value.trim();
    if (!brand) {
        alert('Please enter a brand name.');
        return;
    }

    const tbody = document.querySelector('#report-table tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748b;">Loading...</td></tr>';

    try {
        const response = await fetch(`${API_URL}/report/${encodeURIComponent(brand)}`);
        const data = await response.json();

        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b;">No sales found for "${brand}".</td></tr>`;
            return;
        }

        data.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${record.BRAND}</strong></td>
                <td>${record.MODEL}</td>
                <td>${record.QUANTITY}</td>
                <td>${new Date(record.SALE_DATE).toLocaleDateString()}</td>
                <td style="font-weight: 600; color: #22c55e;">$${record.REVENUE.toFixed(2)}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Failed to load report.</td></tr>';
        console.error('Error fetching brand report:', error);
    }
}

// ================================================================
// Function 11: Check low stock alerts (TRIGGER log table)
// ================================================================
async function fetchAlerts() {
    const tbody = document.querySelector('#alerts-table tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748b;">Loading...</td></tr>';

    try {
        const response = await fetch(`${API_URL}/alerts`);
        const data = await response.json();

        tbody.innerHTML = '';

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color: green;">✅ No low stock alerts — all good!</td></tr>';
            return;
        }

        data.forEach(alert => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${alert.PHONE_ID}</td>
                <td><strong>${alert.BRAND}</strong></td>
                <td>${alert.MODEL}</td>
                <td style="color: #ef4444; font-weight: bold;">⚠️ ${alert.STOCK_LEFT} units</td>
                <td>${new Date(alert.ALERT_TIME).toLocaleString()}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:red;">Failed to load alerts.</td></tr>';
        console.error('Error fetching alerts:', error);
    }
}