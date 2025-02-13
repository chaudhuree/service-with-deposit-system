## Suppose, amar akta service ache .User eshe amar service nibe.

- so first a a user k 50% deposit korte hobe. -> aita korle webhook hit hobe and console a dekhabe success and other details.
- then kono karone jodi reservation er status ta canceled kora hoy tahole tk refunded hoye jabe.
- and completed korle baki 50% taka kete nibe.
- protita event er jonne webhook call hobe.

---

- updated code ```refund-system``` branch a ache
- authentication korte chaitechi na tai kono automatic input sytem rakhi nai.
- amader first a akjon user register korte hobe. tahole automatic stripe a o customer create hoye jabe.
- then service create korte hobe.
- akhn reserve korar jonne amader userid and service id lagbe.
- so amra mongodb theke id gulo copy kore nea then input box a dea then card details dea submit korle akta reservation create hobe and user er account theke 50% total amount er kete nibe
- then reservation er status update korar jonne amader mongodb dashboard theke id ta copy kore then drop box theke status change kore submit kore dite hobe.

---

## DONE