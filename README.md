# iotcanon
### TODO
/api/setting/disable を実装する
指定IDのenableをOFFにする

twilioへのパラメータ　　twilioからの返信パラメータ
電話番号				（返信はない場合がある）
センサ名				ID
ID

こちらは、簡易セキュリティサービスの自動電話サービスです
センサ「ｘｘｘ」が反応しました。

以降電話での通知が不要な場合は、電話機のボタン１を押してください
電話通知を行うように戻すには、ウェブでの設定画面で「有効チェックボックス」にチェックを入れてください。





### DEBUG
- 環境センサ
curl http://localhost:5000/api/webiot -X POST -H "Content-Type: application/json" -d '{"id": "ID001", "datatype": "temperature", "value": 23}'
curl http://localhost:5000/api/webiot -X POST -H "Content-Type: application/json" -d '{"id": "ID001", "datatype": "humidity", "value": 60}'
curl http://localhost:5000/api/webiot -X POST -H "Content-Type: application/json" -d '{"id": "ID001", "datatype": "pressure", "value": 1014}'

- 人感センサ
curl http://localhost:5000/api/move -X POST -H "Content-Type: application/json" -d '{"id": "BPCM03", "datatype": "xxx", "value": 1}'
