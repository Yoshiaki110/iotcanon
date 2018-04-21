# iotcanon
### TODO
- LINE
 - 電話した場合

### DEBUG
- 環境センサ
curl http://localhost:5000/api/webiot -X POST -H "Content-Type: application/json" -d '{"id": "ID001", "datatype": "temperature", "value": 23}'
curl http://localhost:5000/api/webiot -X POST -H "Content-Type: application/json" -d '{"id": "ID001", "datatype": "humidity", "value": 60}'
curl http://localhost:5000/api/webiot -X POST -H "Content-Type: application/json" -d '{"id": "ID001", "datatype": "pressure", "value": 1014}'

- 人感センサ
curl http://localhost:5000/api/move -X POST -H "Content-Type: application/json" -d '{"id": "BPCM03", "datatype": "xxx", "value": 1}'
