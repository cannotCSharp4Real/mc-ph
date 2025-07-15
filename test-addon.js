// Test add-ons creation
const http = require('http');

const testAddOnCreation = () => {
    const testData = {
        name: 'Test Add-on',
        description: 'Test description',
        category: 'add-ons',
        price: 25.50,
        inStock: true
    };
    
    const postData = JSON.stringify(testData);
    
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/products',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + (process.env.TEST_TOKEN || 'test-token'),
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    
    const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('Response status:', res.statusCode);
            console.log('Response headers:', res.headers);
            console.log('Response body:', data);
        });
    });
    
    req.on('error', (error) => {
        console.error('Error:', error);
    });
    
    req.write(postData);
    req.end();
};

testAddOnCreation();
