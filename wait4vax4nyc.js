#!/usr/bin/env node
var fetch = require('node-fetch');

if(process.argv.length < 5) {
	console.error("Usage:", process.argv[0], "<date of birth>", "<zip code>", "<range in miles>", "[email]");
	console.error("e.g.:", process.argv[0], "1975-10-20", "10002", "3") ;
	process.exit(1);
}

var dob = process.argv[2];
var zip = process.argv[3];
var range = parseInt(process.argv[4]);

if(process.argv.length >= 6) {
	email = process.argv[5];
}

var data = {
	message: {
		 "actions": [
			{
 					"id": "91;a",
 					"descriptor": "aura://ApexActionController/ACTION$execute",
 					"callingDescriptor": "UNKNOWN",
 					"params": {
						"namespace": "",
						"classname": "VCMS_BookAppointmentCtrl",
						"method": "fetchDataWrapper",
						"params": {
  							"isOnPageLoad": false,
  							"scheduleDate": "2021-03-30",
  							"zipCode": "10002",
  							"selectedVeventId": null,
  							"selectedVeventDate": null,
  							"selectedSlotTime": null,
  							"isSecondDose": false,
  							"appointmentSlotId": null,
  							"vaccineName": "",
  							"isReschedule": false,
  							"isClinicPortal": false,
  							"isCallCenter": false,
  							"patientZipCode": "10002",
  							"patientDob": "1975-10-20",
  							"patientEligibility": [
								"People ages 65 and older"
  							]
						},
					"cacheable": false,
					"isContinuation": false
 					}
			}
  		]
	},
	aura: {
		context: {
			"mode": "PROD",
			"fwuid": "Q8onN6EmJyGRC51_NSPc2A",
			"app": "siteforce:communityApp",
			"loaded": {
				"APPLICATION@markup://siteforce:communityApp": "XrAWq7KlNf8wSyobBsPNEA"
			},
			"dn":[],
			"globals":{},
			"uad":false
		},
		pageURI: "/patient/s/vaccination-schedule",
		token: undefined
	}
};

function paramsToString(params) {
	return Object.keys(params).map(key => {
		var value = params[key];
		if(typeof value === "object") {
			value = JSON.stringify(value);
		}
		return key+"="+encodeURIComponent(value);
	}).join("&");
}

function check4vax() {
	console.error(new Date(), "Checking...");
	var params = {
		message: data.message
	};

	Object.keys(data.aura).forEach(key => {
		var value = data.aura[key];
		params["aura."+key] = value;
	});

	var paramsString = paramsToString(params);
	var url = "https://vax4nyc.nyc.gov/patient/s/sfsites/aura?r=9&aura.ApexAction.execute=1";
	return fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" }, body: paramsString}).then(response => response.json());
}

var params = data.message.actions[0].params.params;
params.zipCode = zip; 
params.patientZipCode = zip;
params.patientDob = dob; 
var date = new Date();
params.scheduleDate = [ date.getFullYear(), ("0"+(date.getMonth()+1)).slice(-2), ("0"+date.getDate()).slice(-2) ].join("-");

function checkAndRepeat() {
	check4vax()
	.then(response => {
			console.error("Response", JSON.stringify(response, null, 4));
		var results = response.actions[0].returnValue.returnValue.lstMainWrapper;
		if(results.length > 0) {
			results = results[0].lstDataWrapper;
		}
		if(results.length > 0) {
			console.error("Unfiltered", JSON.stringify(results, null, 4));
		}
		if(range) {
			results = results.filter(result => result.mileRange < range);
			console.error("Filtered", JSON.stringify(results, null, 4));
		}
		if(results.length > 0) {
			console.log(JSON.stringify(results, null, 4));
			sendMail(results);
			return;
		}
		setTimeout(checkAndRepeat, 300000);
	});
}
checkAndRepeat();

function sendMail(results) {
	var nodemailer = require('nodemailer');
	const transporter = nodemailer.createTransport({
		port: 25,
		host: 'localhost',
		tls: {
			rejectUnauthorized: false
		},
	});

	var message = {
		from: 'noreply@gmail.com',
		to: email,
		subject: `${results.length} results in ${range} miles for ${zip}`,
		text: `
				https://vax4nyc.nyc.gov/patient/s/ to register for vaccine.
		`,
		html: `
				<a href="https://vax4nyc.nyc.gov/patient/s/">https://vax4nyc.nyc.gov/patient/s/</a> to register for vaccine.
		`,
	};

	transporter.sendMail(message, (error, info) => {
		if (error) {
			return console.log(error);
		}
		console.error('Message sent: %s', info.messageId);
	});
}

