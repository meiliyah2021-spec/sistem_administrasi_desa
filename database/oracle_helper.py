import oracledb
from database.connection import get_connection

def execute_query(sql, params=None, fetch_all=True):
    """
    Executes a SQL SELECT query and returns the results as a list of dictionaries,
    mapping Oracle column names to dictionary keys in lowercase.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        if params:
            cursor.execute(sql, params)
        else:
            cursor.execute(sql)
            
        if not fetch_all:
            row = cursor.fetchone()
            if row:
                col_names = [col[0].lower() for col in cursor.description]
                return dict(zip(col_names, row))
            return None
            
        rows = cursor.fetchall()
        col_names = [col[0].lower() for col in cursor.description]
        
        results = []
        for r in rows:
            results.append(dict(zip(col_names, r)))
            
        return results
    except Exception as e:
        print(f"DATABASE SQL ERROR: {sql}, Params: {params}, Error: {str(e)}")
        raise e
    finally:
        cursor.close()
        conn.close()

def execute_non_query(sql, params=None):
    """Executes an INSERT, UPDATE, or DELETE statement directly."""
    conn = get_connection()
    cursor = conn.cursor()
    try:
        if params:
            cursor.execute(sql, params)
        else:
            cursor.execute(sql)
        conn.commit()
        return cursor.rowcount
    except Exception as e:
        conn.rollback()
        print(f"DATABASE NON-QUERY ERROR: {sql}, Params: {params}, Error: {str(e)}")
        raise e
    finally:
        cursor.close()
        conn.close()

def call_procedure(proc_name, params=None):
    """
    Calls an Oracle PL/SQL Stored Procedure.
    Params must be a list of values, or variables created via cursor.var().
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # If parameters contain out variables or are custom, call proc
        res = cursor.callproc(proc_name, params or [])
        conn.commit()
        return res
    except Exception as e:
        conn.rollback()
        print(f"DATABASE PROCEDURE ERROR: {proc_name}, Params: {params}, Error: {str(e)}")
        raise e
    finally:
        cursor.close()
        conn.close()

def call_function(func_name, return_type, params=None):
    """
    Calls an Oracle PL/SQL Function and returns the output value.
    'return_type' can be oracledb.NUMBER, oracledb.STRING, etc.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        res = cursor.callfunc(func_name, return_type, params or [])
        return res
    except Exception as e:
        print(f"DATABASE FUNCTION ERROR: {func_name}, Params: {params}, Error: {str(e)}")
        raise e
    finally:
        cursor.close()
        conn.close()
