react-dom_client.js?v=edc408b6:21609 Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools
firebase.js:21 [2025-06-15T23:11:36.105Z]  @firebase/firestore: Firestore (11.9.0): enableIndexedDbPersistence() will be deprecated in the future, you can use `FirestoreSettings.cache` instead.
defaultLogHandler @ chunk-BL7CDIX5.js?v=0a737e14:1206
warn @ chunk-BL7CDIX5.js?v=0a737e14:1270
__PRIVATE_logWarn @ firebase_firestore.js?v=9b328548:2632
enableIndexedDbPersistence @ firebase_firestore.js?v=9b328548:16164
(anonymous) @ firebase.js:21
FoodLibrary.jsx:130 Nutritionix API Request: {url: 'https://trackapi.nutritionix.com/v2/natural/nutrients', method: 'POST', headers: {…}, body: '{"query":"chicken fingers"}'}
FoodLibrary.jsx:158 saveNutritionixToLibrary called {label: 'chicken fingers', brand_name: null, photo: 'https://nix-tag-images.s3.amazonaws.com/1872_thumb.jpg', nix_item_id: null, common_type: null, …}
FoodLibrary.jsx:160 food_name is missing or not a string: {label: 'chicken fingers', brand_name: null, photo: 'https://nix-tag-images.s3.amazonaws.com/1872_thumb.jpg', nix_item_id: null, common_type: null, …}
saveNutritionixToLibrary @ FoodLibrary.jsx:160
onClick @ App.jsx:699
await in onClick
callCallback2 @ react-dom_client.js?v=edc408b6:3680
invokeGuardedCallbackDev @ react-dom_client.js?v=edc408b6:3705
invokeGuardedCallback @ react-dom_client.js?v=edc408b6:3739
invokeGuardedCallbackAndCatchFirstError @ react-dom_client.js?v=edc408b6:3742
executeDispatch @ react-dom_client.js?v=edc408b6:7046
processDispatchQueueItemsInOrder @ react-dom_client.js?v=edc408b6:7066
processDispatchQueue @ react-dom_client.js?v=edc408b6:7075
dispatchEventsForPlugins @ react-dom_client.js?v=edc408b6:7083
(anonymous) @ react-dom_client.js?v=edc408b6:7206
batchedUpdates$1 @ react-dom_client.js?v=edc408b6:18966
batchedUpdates @ react-dom_client.js?v=edc408b6:3585
dispatchEventForPluginEventSystem @ react-dom_client.js?v=edc408b6:7205
dispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay @ react-dom_client.js?v=edc408b6:5484
dispatchEvent @ react-dom_client.js?v=edc408b6:5478
dispatchDiscreteEvent @ react-dom_client.js?v=edc408b6:5455
