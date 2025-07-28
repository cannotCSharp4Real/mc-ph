// Test script to verify products API
const http = require('http');

function testProductsAPI() {
    console.log('Testing products API...');
    
    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/products',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('Response status:', res.statusCode);
            try {
                const parsedData = JSON.parse(data);
                console.log('Response data:', parsedData);
                
                if (res.statusCode === 200) {
                    console.log('✅ Products API is working!');
                    console.log(`Found ${parsedData.length} products`);
                } else {
                    console.log('❌ Products API failed:', parsedData.message);
                }
            } catch (error) {
                console.log('❌ Error parsing response:', error.message);
                console.log('Raw response:', data);
            }
        });
    });
    
    req.on('error', (error) => {
        console.error('❌ Error testing products API:', error.message);
    });
    
    req.end();
}

testProductsAPI();
