# misc

### wait4vax4nyc
Poll https://vax4nyc.nyc.gov/patient/s/ every 5 minutes and check if there is vaccine available withing a range of a zip code.  
It will stop once it finds availability.  
If email is specified - an email will be sent that results found.  
```
npm i node-fetch nodemailer
./wait4vax4nyc.js 1975-10-20 10002 10 your-email@provider.com
```
Note: your email may be a phone-number@provider.com. e.g. For att it can be 2125551212@txt.att.net. There are similar email to sms gateway for most providers.
