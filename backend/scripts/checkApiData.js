async function checkMasterItems() {
  try {
    const response = await fetch('http://localhost:5000/api/bom/master-items');
    const data = await response.json();
    
    console.log('Data Type:', typeof data);
    console.log('Is Array:', Array.isArray(data));
    
    let items = data;
    if (!Array.isArray(data) && data.items) {
        items = data.items;
    }
    
    if (Array.isArray(items)) {
        const endClamp = items.find(i => i.serialNumber === '56');
        
        console.log('End Clamp (SN 56) Data from API:');
        console.log(JSON.stringify(endClamp, null, 2));
        
        if (endClamp && endClamp.sunrackProfile) {
            console.log('✅ sunrackProfile is present');
            console.log('Image:', endClamp.sunrackProfile.profileImage);
        } else {
            console.log('❌ sunrackProfile is MISSING');
        }
    } else {
        console.log('Response structure:', JSON.stringify(data, null, 2).substring(0, 500));
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkMasterItems();
