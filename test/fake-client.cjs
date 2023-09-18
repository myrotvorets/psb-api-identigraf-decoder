const Client_MySQL = require('knex/lib/dialects/mysql');

class Connection {
    async close() {
        // Do nothing
    }
}

class FakeClient extends Client_MySQL {
    driverName = 'fake';

    _driver() {
        return {};
    }

    acquireRawConnection() {
        return Promise.resolve(new Connection());
    }

    destroyRawConnection(connection) {
        return connection.close();
    }
}

module.exports = { FakeClient };
