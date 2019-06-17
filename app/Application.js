/**
 * The main application class. An instance of this class is created by app.js when it
 * calls Ext.application(). This is the ideal place to handle application launch and
 * initialization details.
 */

var APIURL = "https://localhost:5001/Api/";
var GETID = 'Auth/GetId';
var LOGINVIEW = 'Auth/ViewLogin';
var LOGINPOST = 'Auth/Login';
var HOMEVIEW = 'Menu/ViewMenu';
var DATACATALOGS = 'Catalog/GetData';
var MODELCATALOGS = 'Catalog/GetModel';
var SETDATA = APIURL + 'Data';
var MESSAGEERROR = 'Ocurrio un error por favor notifiquelo al administrador';
var GETVIEWS = APIURL + "Views/{0}/view/{1}";
var FILTROREQUIINSUMO = new Object();
FILTROREQUIINSUMO.filtros = [];

var APIURL

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
        this.onGetIdApp();
        /*Debe de validar si el usuario ya esta logueado*/
        //this.onCreateHome();
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

        Ext.Ajax.request({
            url: APIURL + GETID,
            async: false,
            method: 'GET',
            params: location.href,
            success: function(response, opts) {
                var obj = Ext.decode(response.responseText);
                localStorage.setItem("AppID", obj.id);
                currentThis.onGetViewLogin();
            },

            failure: function(response, opts) {
                window.alert("Error");
            }
        });
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

        if (comp.listOfValues) {
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

            var store = Ext.data.StoreManager.lookup(nameStore);
            store.load({
                params: dataParametros
            });
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

        Ext.Ajax.request({
            url: url,
            method: 'GET',
            success: function(response, opts) {
                var obj = Ext.decode(response.responseText);

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

    onGuardarEntidades: function(obj, parametros) {
        var form = obj.ownerCt.getForm();
        console.log(form.isValid());
        if (form.isValid()) {
            form.submit({
                clientValidation: true,
                jsonSubmit:true,
                url: SETDATA,
                method: 'POST',
                waitMsg: 'Por favor espere',
                success: function() {
                    console.log('success');
                }, 
                failure: function() {
                    console.log('failure');
                }

            })
        }

        console.log(parametros);
    },
});