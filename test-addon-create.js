// Test add-on creation with authentication
const http = require('http');

// Mock admin token - you should replace this with a real token from localStorage
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NzY4ZWQ1YTMyYWIwZjk5NDYwOGY0NCIsImVtYWlsIjoiYWRtaW5AbWNwaC5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MjEwNzU3MzMsImV4cCI6MTcyMTE2MjEzM30.example';

const testAddOnCreation = () => {
    const testData = {
        name: 'Extra Vanilla Syrup',
        description: 'Sweet vanilla syrup for drinks',
        category: 'add-ons',
        price: 15,
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
            'Authorization': 'Bearer ' + mockToken,
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
            console.log('Response body:', data);
            
            try {
                const parsed = JSON.parse(data);
                console.log('Parsed response:', parsed);
            } catch (e) {
                console.log('Could not parse response as JSON');
            }
        });
    });
    
    req.on('error', (error) => {
        console.error('Error:', error);
    });
    
    console.log('Sending request with data:', testData);
    req.write(postData);
    req.end();
};

testAddOnCreation();
