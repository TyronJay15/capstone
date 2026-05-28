"""Use PyMySQL as MySQLdb driver when connecting to MySQL."""
try:
    import pymysql

    pymysql.install_as_MySQLdb()
except ImportError:
    pass
