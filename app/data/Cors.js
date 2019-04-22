/*
* @Author: garenas
* @Date:   2019-04-15 00:15:58
* @Last Modified by:   garenas
* @Last Modified time: 2019-04-15 00:16:15
*/
Ext.define('Ext.data.Cors', {
    extend: 'Ext.data.Connection',
    alternateClassName: ['Ext.Cors'],
    singleton: true,
    useDefaultXhrHeader: false,
    autoAbort: false
});