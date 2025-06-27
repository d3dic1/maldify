const https = require('https');

const data = `{
	"activities": [
		{
			"activity_id": "act:cm:custom-is-releasit-cod-fee-installed",
			"attributes": {
				"bol:cm:installed": true,
				"bol:cm:uninstall": true,
				"phn:cm:phone": {
					"c": "61",
					"n": "123123123"
				},
				"str:cm:email": "example string value",
				"str:cm:firstname": "example string value",
				"str:cm:mailingcity": "example string value",
				"str:cm:mailingcountry": "example string value",
				"str:cm:mailingpostalcode": "example string value",
				"str:cm:mailingstate": "example string value",
				"str:cm:mailingstreet": "example string value",
				"str:cm:newplan": "example string value",
				"str:cm:oldplan": "example string value",
				"str:cm:ownername": "example string value",
				"str:cm:plan": "example string value",
				"str:cm:platform": "example string value",
				"str:cm:reason": "example string value",
				"str:cm:source": "example string value",
				"str:cm:status": "example string value",
				"str:cm:website": "example string value",
				"tme:cm:timestamp": "2025-05-30T15:00:55Z",
				"tme:cm:uninstalledat": "2025-05-30T15:00:55Z"
			},
			"fields": {
				"str::email": "contact@email.com"
			},
			"location": {
				"source_ip": "172.217.4.1",
				"custom": null,
				"address": null
			}
		}
	],
	"merge_by": [
		"str::email"
	]
}`;

const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': 'PRV-shruti-rxdemJCSuP68mZgeN0hqX2ko4wDQ3uIun2JWvEGMGeU', // <-- Replace with your actual API key
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = https.request('https://api-us.ortto.com/v1/activities/create', options, res => {
    res.on('data', d => {
        process.stdout.write(d);
    });
});

req.on('error', error => {
    console.error(error);
});
req.write(data);
req.end();