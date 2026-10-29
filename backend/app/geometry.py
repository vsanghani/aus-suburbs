"""PostGIS geometry column type for the curated models.

The migration SQL is the source of the column. This type exists so the
models name the same geometry columns without taking a GeoAlchemy dependency.
"""

from sqlalchemy.types import UserDefinedType


class Geometry(UserDefinedType):
    cache_ok = True

    def __init__(self, geometry_type: str, srid: int = 4326) -> None:
        self.geometry_type = geometry_type
        self.srid = srid

    def get_col_spec(self, **kw: object) -> str:
        return f"geometry({self.geometry_type},{self.srid})"
