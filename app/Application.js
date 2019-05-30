/**
 * The main application class. An instance of this class is created by app.js when it
 * calls Ext.application(). This is the ideal place to handle application launch and
 * initialization details.
 */

var APIURL = "../../magajoApi/Api/";
var GETID = 'Auth/GetId';
var LOGINVIEW = 'Auth/ViewLogin';
var LOGINPOST = 'Auth/Login';
var HOMEVIEW = 'Menu/ViewMenu';
var DATACATALOGS = 'Catalog/GetData';
var MODELCATALOGS = 'Catalog/GetModel';
var SETREQUI = APIURL + 'Catalog/SetRequi';
var MESSAGEERROR = 'Ocurrio un error por favor notifiquelo al administrador';
var GETVIEWS = APIURL + "Views/{0}/view/{1}";
var FILTROREQUIINSUMO = new Object();
FILTROREQUIINSUMO.filtros = [];

var myMask;

var body = document.body,
    html = document.documentElement;

var HEIGHT = Math.max(body.scrollHeight, body.offsetHeight,
    html.clientHeight, html.scrollHeight, html.offsetHeight);

var MAXHEIGHT = (HEIGHT - 100);

var WIDTH = Math.max(body.scrollWidth, body.offsetWidth,
    html.clientWidth, html.scrollWidth, html.offsetWidth);

var MAXWIDTH = (WIDTH - 100);

Ext.define('MAGAJOWeb.Application', {
    extend: 'Ext.app.Application',

    name: 'MAGAJOWeb',

    quickTips: false,
    platformConfig: {
        desktop: {
            quickTips: true
        }
    },

    stores: [
        // TODO: add global / shared stores here
    ],

    currentView: null,

    launch: function() {
        // TODO - Launch the application
        this.onGetIdApp();
    },

    onAppUpdate: function() {
        Ext.Msg.confirm('Application Update', 'This application has an update, reload?',
            function(choice) {
                if (choice === 'yes') {
                    window.location.reload();
                }
            }
        );
    },

    onGetIdApp: function() {
        //console.log("onGetIdApp");

        var loggedIn;
        var appId;
        var currentThis = this;
        loggedIn = localStorage.getItem("LoggedIn");

        //console.log(loggedIn);
        if (!(loggedIn == 'true')) {
            //console.log("onGetIdApp3");
            //console.log(APIURL + GETID);

            Ext.Ajax.request({
                url: APIURL + GETID,
                method: 'POST',
                params: location.href,
                success: function(response, opts) {
                    //console.log("onGetIdApp ajax");
                    var obj = Ext.decode(response.responseText);
                    localStorage.setItem("AppID", obj.id);
                    currentThis.onGetViewLogin();
                },

                failure: function(response, opts) {
                    window.alert("Error");
                }
            });
        } else {
            //console.log("onGetIdApp2");

            this.onCreateHome();
        }
    },

    onGetViewLogin: function() {
        var appId = localStorage.getItem("AppID");
        if (appId != '') {
            var apiUrl = APIURL + LOGINVIEW + '/' + appId;
            this.onGetAjaxView(apiUrl, 'GET', null, null);
        }
    },

    onGetAjaxView: function(url, method, data, bind) {
        var currentThis = this;

        if (myMask) {
            myMask.show();
        }

        Ext.Ajax.request({
            url: url,
            method: method,
            jsonData: data,
            success: function(response, opts) {
                var obj = Ext.decode(response.responseText);

                if (obj.success) {
                    currentThis.onCreateView(obj, bind);
                    if (myMask) {
                        myMask.hide();
                    }
                } else {
                    Ext.MessageBox.alert('Error', obj.message);
                }
            },

            failure: function(response, opts) {
                window.alert("Error");
            }
        });
    },

    onCreateView: function(obj, bind) {

        if (this.currentView && bind == null)
            this.currentView.destroy();

        var itemComp = [];
        var currentThis = this;

        for (var b in obj.Components) {
            itemComp.push(this.onCreateComponent(obj.Components[b]));
        }


        console.log(itemComp);

        if (bind == null) {
            this.currentView = Ext.create('Ext.panel.Panel', {
                renderTo: Ext.getBody(),
                title: 'MAGAJOWeb',
                layout: 'border',
                width: '100%',
                height: HEIGHT,
                items: itemComp
            });

            myMask = new Ext.LoadMask({
                msg: 'Cargando...',
                target: this.currentView
            });


        } else {
            var cont = Ext.getCmp(bind);
            //console.log(cont);
            cont.removeAll(true);
            cont.updateLayout();
            cont.add(itemComp);
        }
    },

    onCreateComponent: function(comp) {
        var currentThis = this;

        var extComponent = {
            id: comp.componentId,
            xtype: comp.componentType
        };

        if (comp.mapping) {
            extComponent.dataIndex = comp.mapping.field;
        }

        for (var b in comp.attributes) {
            if (comp.attributes[b].attributeName == "height") {
                extComponent[comp.attributes[b].attributeName] = parseInt(comp.attributes[b].attributeValue);
            } else if (comp.attributes[b].attributeName == "width") {
                extComponent[comp.attributes[b].attributeName] = parseInt(comp.attributes[b].attributeValue);
            } else {
                if ((comp.attributes[b].attributeValue == "true") || (comp.attributes[b].attributeValue == "false") ||
                    (comp.attributes[b].attributeValue == "True") || (comp.attributes[b].attributeValue == "False") ||
                    (comp.attributes[b].attributeValue == "FALSE") || (comp.attributes[b].attributeValue == "FALSE")) {
                    comp.attributes[b].attributeValue = comp.attributes[b].attributeValue.toLowerCase();
                    extComponent[comp.attributes[b].attributeName] = (comp.attributes[b].attributeValue === "true");
                } else {
                    extComponent[comp.attributes[b].attributeName] = comp.attributes[b].attributeValue;
                }
            }
        }

        for (var b in comp.Components) {
            var type = comp.Components[b].type;
            var componente = comp.Components[b].items;

            if (type != undefined) {
                extComponent[type] = [];
            } else {
                extComponent.items = [];
            }

            for (var c in componente) {
                var extCreateComponente = componente[c];
                var itemComp = this.onCreateComponent(extCreateComponente);
                if (type != undefined) {
                    extComponent[type].push(itemComp);
                } else {
                    extComponent.items.push(itemComp);
                }
            }
        }

        if (comp.events) {
            if (comp.events.length > 0) {
                extComponent.listeners = [];
            }
        }

        for (var b in comp.events) {

            var cmpEvent = comp.events[b];

            for (var c in cmpEvent.behaviours) {

                if (cmpEvent.eventName != "create") {
                    var evetBehaviors = cmpEvent.behaviours[c];

                    var event = [];
                    event[cmpEvent.eventName] = function() {
                        var parametros = [];

                        for (var d in evetBehaviors.parameters) {
                            var param = evetBehaviors.parameters[d];
                            //console.log(param);
                            parametros[param.parameterName] = param.parameterValue;
                        }

                        var fun = "MAGAJOWeb.app." + evetBehaviors.behaviourId + "(this, parametros)";
                        //console.log(fun);

                        eval(fun);
                    }

                    extComponent.listeners.push(event);
                }
            }
        }

        if ((comp.listOfValues) && (comp.componentId != "ERPZANTEREQUISICIONES00000000000000000000000000012")) {
            var nameModel = comp.listOfValues.entity + "model" + Date.now();
            var nameStore = comp.listOfValues.entity + "store" + Date.now();

            this.onListOfValuesAjax(extComponent, comp, nameModel, nameStore);
            extComponent.store = Ext.data.StoreManager.lookup(nameStore);

            var dataParametros = {
                IEntityID: comp.listOfValues.entity,
                Itoken: localStorage.getItem("UserToken"),
                FilterData: null,
                SortData: null,
                QueryLimits: null,
                ColumnData: null,
                MGJAPP_ID: localStorage.getItem("AppID")
            }

            if (comp.componentId == "ERPEXPLOSIONINSUMOS0000000000000000000000000000031" ||
                comp.componentId == "ERPEXPLOSIONINSUMOS0000000000000000000000000000039") {
                var valuesFilter = Ext.getCmp('ERPZANTEREQUISICIONES00000000000000000000000000005').getValue();

                if (comp.componentId == "ERPEXPLOSIONINSUMOS0000000000000000000000000000031") {
                    extComponent.selModel = {
                        selType: 'checkboxmodel'
                    }
                }

                dataParametros.FilterData = {
                    "condition": "AND",
                    "filters": [{
                        "field": "Neodata0000000000007LINK0000000000000003",
                        "values": [
                            valuesFilter
                        ],
                        "operador": "="
                    }]
                }
            }

            console.log(dataParametros);

            var store = Ext.data.StoreManager.lookup(nameStore);
            store.load({
                params: dataParametros
            });
        } else if ((comp.listOfValues) && (comp.componentId == "ERPZANTEREQUISICIONES00000000000000000000000000012")) {

            var nameModel = "modelRequiInsumo";
            var nameStore = "storeRequiInsumo";

            Ext.define(nameModel, {
                extend: 'Ext.data.Model',
                fields: [{
                    name: 'MGJREPO_ID',
                    type: 'string',
                    "unique": true
                }, {
                    name: 'DESCRIPCIONLARGA',
                    type: 'string'
                }, {
                    name: 'UNIDAD',
                    type: 'string'
                }, {
                    name: 'INSUMO',
                    type: 'string'
                }, {
                    name: 'CANTIDADPEDIDA',
                    type: 'number'
                }, {
                    name: 'CANTIDADREQUERIDA',
                    type: 'number'
                }, {
                    name: 'CANTIDADSOLICITAR',
                    type: 'string'
                }, {
                    name: 'OBSERVACIONES',
                    type: 'string'
                }]
            });

            Ext.create('Ext.data.Store', {
                storeId: nameStore,
                model: nameModel,
                proxy: {
                    type: 'ajax',
                    url: APIURL + 'Catalog/ObtieneExplosionDatos',
                    paramsAsJson: true,
                    actionMethods: {
                        read: 'POST'
                    },
                    reader: {
                        type: 'json',
                        rootProperty: 'data'
                    }
                }
            });

            extComponent.store = Ext.data.StoreManager.lookup(nameStore);

            extComponent.plugins = {
                ptype: 'cellediting',
                clicksToEdit: 1
            }
        }

        switch (comp.componentId) {
            case "ERPZANTEREQUISICIONES00000000000000000000000000029":
                extComponent.editor = {
                    completeOnEnter: false,
                    field: {
                        xtype: 'numberfield',
                        allowBlank: false,
                        allowDecimals: true
                    }
                }
                break;
            case "ERPZANTEREQUISICIONES00000000000000000000000000031":
                extComponent.editor = {
                    completeOnEnter: false,
                    field: {
                        xtype: 'textareafield',
                        allowBlank: false
                    }
                }
                break;
        }

        return extComponent;
    },

    /*Funcion que crea el datastore*/
    onListOfValuesAjax: function(extCmp, dataCmp, nameModel, nameStore) {
        var apiUrl = APIURL + DATACATALOGS;
        var apiModelUrl = APIURL + MODELCATALOGS;
        var currentContext = this;

        var modelParametros = {
            MGJAPP_ID: localStorage.getItem("AppID"),
            IEntityID: dataCmp.listOfValues.entity
        }

        /*Model*/
        Ext.Ajax.request({
            url: apiModelUrl,
            method: 'POST',
            async: false,
            jsonData: modelParametros,
            success: function(response, opts) {
                var obj = Ext.decode(response.responseText);

                //console.log(obj);

                Ext.define(nameModel, {
                    extend: 'Ext.data.Model',
                    fields: obj.model
                });

                Ext.create('Ext.data.Store', {
                    storeId: nameStore,
                    model: nameModel,
                    proxy: {
                        type: 'ajax',
                        url: apiUrl,
                        paramsAsJson: true,
                        actionMethods: {
                            read: 'POST'
                        },
                        reader: {
                            type: 'json',
                            rootProperty: 'data'
                        }
                    }
                });

            },
            failure: function(response, opts) {
                Ext.MessageBox.alert('Error', MESSAGEERROR);
            }
        });
    },

    onIniciaSesion: function(obj, parametros) {
        var currentThis = this;

        var form = obj.ownerCt.ownerCt.getForm();

        if (form.isValid()) {

            var apiUrlLogin = APIURL + LOGINPOST;

            var pms = form.getValues();

            var logn = {
                'appId': localStorage.getItem("AppID"),
                'userName': pms['ERPZANTELOGIN0000000000000000000000000000000000004-inputEl'],
                'userPassword': pms['ERPZANTELOGIN0000000000000000000000000000000000005-inputEl']
            }

            Ext.Ajax.request({
                url: apiUrlLogin,
                method: 'POST',
                jsonData: logn,
                success: function(response, opts) {
                    var obj = Ext.decode(response.responseText);

                    if (obj.success) {
                        localStorage.setItem("LoggedIn", true);
                        localStorage.setItem("UserToken", obj.token);
                        currentThis.onCreateHome();
                    } else {
                        Ext.MessageBox.alert('Error', obj.message);
                    }
                },

                failure: function(response, opts) {
                    var obj = Ext.decode(response.responseText);

                    if (obj.message) {
                        Ext.MessageBox.alert('Error', obj.message);
                    } else {
                        Ext.MessageBox.alert('Error', MESSAGEERROR);
                    }
                }
            });
        }
    },

    onCreateHome: function() {
        var appId = localStorage.getItem("AppID");
        var apiUrl = APIURL + HOMEVIEW + '/' + appId;
        this.onGetAjaxView(apiUrl, 'GET', null, null);
    },

    onCargarVista: function(obj, parametros) {
        //console.log("onCargarVista");
        //console.log(parametros);
        var appId = localStorage.getItem("AppID");
        var apiUrl = APIURL + 'Views/' + appId + '/view/' + parametros.Vista;
        this.onGetAjaxView(apiUrl, 'GET', null, parametros.Container);
    },

    onCerrarSesion: function(obj, parametros) {
        localStorage.setItem("AppID", null);
        localStorage.setItem("UserToken", null);
        localStorage.setItem("LoggedIn", false);
        this.onGetIdApp();
    },

    onDialogoVista: function(obj, parametros) {
        if (myMask) {
            myMask.show();
        }

        var currentThis = this;
        var appId = localStorage.getItem("AppID");

        var url = GETVIEWS.replace("{0}", appId);
        url = url.replace("{1}", parametros.Vista);

        //console.log(url);

        Ext.Ajax.request({
            url: url,
            method: 'GET',
            success: function(response, opts) {
                var obj = Ext.decode(response.responseText);

                //console.log(obj);

                if (obj.success) {
                    var itemComp = [];

                    for (var b in obj.Components) {
                        itemComp.push(currentThis.onCreateComponent(obj.Components[b]));
                    }

                    console.log(itemComp);

                    Ext.create('Ext.window.Window', {
                        title: obj.ViewName,
                        minWidth: 730,
                        maxWidth: MAXHEIGHT,
                        minHeight: 600,
                        maxHeight: MAXWIDTH,
                        layout: 'fit',
                        autoDestroy: true,
                        items: itemComp
                    }).show();
                } else {
                    Ext.MessageBox.alert('Error', obj.message);
                }

                if (myMask) {
                    myMask.hide();
                }
            },

            failure: function(response, opts) {
                window.alert("Error");
                if (myMask) {
                    myMask.hide();
                }
            }
        });

    },

    onMuestraExplosionInsumos: function(obj, parametros) {
        console.log(parametros);
    },

    onGuardarEntidades: function(obj, parametros) {
        console.log(parametros);
    },

    onLoadChange: function(obj, parametros) {
        /*var idParent = parametros.FieldIDParent

        var jsonData = {
            condition = "AND",
            filters = [
                {
                    field = idParent,
                    values: [
                        Ext.getCmp(idParent).getValue()
                    ],
                    operator: "="
                }
            ]
        }

        for (var b in parametros.FieldID) {
            

        }*/
    },

    onBeforeLoad: function(obj, parametros) {
        console.log("onBeforeLoad");
    },

    /*Funciones especificas por falta de tiempo*/
    onCargarProyecto: function(obj, parametros) {

        var btnShowInsumos = Ext.getCmp('ERPZANTEREQUISICIONES00000000000000000000000000005').getValue();

        //console.log(btnShowInsumos);

        if (btnShowInsumos != null) {
            Ext.getCmp('ERPZANTEREQUISICIONES00000000000000000000000000050').setDisabled(false);
        } else {
            Ext.getCmp('ERPZANTEREQUISICIONES00000000000000000000000000050').setDisabled(true);
        }

    },

    filtroExplosionInsumos: function(obj, parametros) {
        var valuesFilter = Ext.getCmp('ERPEXPLOSIONINSUMOS0000000000000000000000000000039').getValue();

        if (valuesFilter != null) {
            /*grid*/
            var store = Ext.getCmp('ERPEXPLOSIONINSUMOS0000000000000000000000000000031').getStore();

            var dataParametros = {
                IEntityID: 'Neodata0000000000007',
                Itoken: localStorage.getItem("UserToken"),
                FilterData: null,
                SortData: null,
                QueryLimits: null,
                ColumnData: null,
                MGJAPP_ID: localStorage.getItem("AppID")
            }

            dataParametros.FilterData = {
                "condition": "AND",
                "filters": [{
                    "field": "Neodata0000000000007LINK0000000000000004",
                    "values": [
                        valuesFilter
                    ],
                    "operador": "="
                }]
            }

            console.log(dataParametros);

            store.load({
                params: dataParametros
            });

        } else {
            Ext.MessageBox.alert('Error', "Por favor seleccione un valor para filtrar");
        }
    },

    agregarInsumoGrid: function() {

        var grid = Ext.getCmp("ERPEXPLOSIONINSUMOS0000000000000000000000000000031");
        var selection = grid.getSelectionModel().getSelection();


        var gridRequi = Ext.getCmp("ERPZANTEREQUISICIONES00000000000000000000000000012");

        for (var b in selection) {
            var data = selection[b].data;

            var filtro = {
                "valor": data.MGJREPO_ID
            };
            FILTROREQUIINSUMO.filtros.push(filtro);
        }

        console.log(FILTROREQUIINSUMO);


        gridRequi.getStore().load({
            params: FILTROREQUIINSUMO
        });

        grid.up('window').close();
    },

    onGuardarRequisicion: function() {
        var formulario = Ext.getCmp("ERPZANTEREQUISICIONES00000000000000000000000000004")

        console.log("valida formulario");

        var gridRequi = Ext.getCmp("ERPZANTEREQUISICIONES00000000000000000000000000012");
        var data = gridRequi.getStore().getData().items;
        var error = false;
        var insumos = [];

        if (data.length > 0) {
            for (var b in data) {
                if (data[b].data.CANTIDADSOLICITAR <= 0) {
                    error = true;
                }

                var insumo = {
                    idInsumo: data[b].data.MGJREPO_ID,
                    CANTIDADSOLICITAR: data[b].data.CANTIDADSOLICITAR,
                    OBSERVACIONES: data[b].data.OBSERVACIONES
                }

                insumos.push(insumo);
            }
        }

        if (error) {
            Ext.MessageBox.alert('Error', "Por favor ingrese la cantidad a solicitar para todos los insumos");
        }

        if ((!error) && (formulario.isValid())) {


            var fechaRequi = Ext.getCmp("ERPZANTEREQUISICIONES00000000000000000000000000013").getValue();
            var codigoAuxiliar = Ext.getCmp("ERPZANTEREQUISICIONES00000000000000000000000000015").getValue();
            var observaciones = Ext.getCmp("ERPZANTEREQUISICIONES00000000000000000000000000010").getValue();
            var lugarEntrega = Ext.getCmp("ERPZANTEREQUISICIONES00000000000000000000000000011").getValue();
            var fechaRequerida = Ext.getCmp("ERPZANTEREQUISICIONES00000000000000000000000000014").getValue();
            var idResponsable = Ext.getCmp("ERPZANTEREQUISICIONES00000000000000000000000000007").getValue();
            var idProyecto = Ext.getCmp("ERPZANTEREQUISICIONES00000000000000000000000000005").getValue();
            var idResponsable1 = Ext.getCmp("ERPZANTEREQUISICIONES00000000000000000000000000008").getValue();
            var idResponsable2 = Ext.getCmp("ERPZANTEREQUISICIONES00000000000000000000000000009").getValue();
            var contrato = Ext.getCmp("ERPZANTEREQUISICIONES00000000000000000000000000016").getValue();

            var requi = {
                Neodata0000000000003DATE0000000000000003: fechaRequi,
                Neodata0000000000003STRING00000000000003: codigoAuxiliar,
                Neodata0000000000003STRING00000000000005: observaciones,
                Neodata0000000000003STRING00000000000006: lugarEntrega,
                Neodata0000000000003DATE0000000000000004: fechaRequerida,
                Neodata0000000000003LINK0000000000000017: idResponsable,
                Neodata0000000000003LINK0000000000000003: idProyecto,
                Neodata0000000000003LINK0000000000000011: idResponsable1,
                Neodata0000000000003LINK0000000000000012: idResponsable2,
                Neodata0000000000003STRING00000000000004: contrato,
				Neodata0000000000003LINK0000000000000013: 37
            }

            requi.insumos = insumos;

            var params = Ext.util.JSON.encode(requi);

            //console.log(params);

            Ext.Ajax.request({
                url: SETREQUI,
                method: 'POST',
                jsonData: {parametros: params},
                success: function(response, opts) {
                    var obj = Ext.decode(response.responseText);

                    if (obj.success) {
                        Ext.MessageBox.alert('Notificación', 'Su alta se hizo correctamente');
                        formulario.reset();
                        gridRequi.getStore().removeAll();
                        gridRequi.getStore().sync();
                    } else {
                        Ext.MessageBox.alert('Error', obj.message);
                    }
                },
                failure: function(response, opts) {
                    Ext.MessageBox.alert('Error', MESSAGEERROR);
                }
            });
        }
    }
});