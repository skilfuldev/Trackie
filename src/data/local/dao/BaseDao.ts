import {NAME_TO_SCHEMA} from '../SchemaMap';
import db from '../Database';

class BaseDao {
  // Workaround for realm's auto update objects. When updating state in a reducer, it tries update value in db. But, transaction required to update db.
  private convertToItem<T extends {[key: string]: any}>(
    item: T & Realm.Object,
    schema: string,
  ): T {
    const object: any = {};
    const properties = Object.getOwnPropertyNames(
      NAME_TO_SCHEMA[schema].properties,
    );
    for (const property of properties) {
      object[property] = item[property];
    }
    return object;
  }

  async getCopyObjectById<T>(
    schema: string,
    id: number,
  ): Promise<T | undefined> {
    const realm = await db.getConnection();
    const result = realm.objectForPrimaryKey<T>(schema, id);
    if (!result) {
      return undefined;
    }
    return this.convertToItem<T>(result, schema);
  }

  async getObjectById<T>(schema: string, id: number): Promise<T | undefined> {
    const realm = await db.getConnection();
    const result = realm.objectForPrimaryKey<T>(schema, id);
    return result;
  }

  async getObjectsById<T extends {id: number}>(
    schema: string,
    ids: number[],
  ): Promise<T[]> {
    const realm = await db.getConnection();
    const objs = realm.objects<T>(schema).snapshot();
    const result: T[] = [];
    for (const obj of objs) {
      if (ids.includes(obj.id)) {
        result.push(obj);
      }
    }
    return result;
  }

  async getAllObjects<T>(schema: string): Promise<T[]> {
    const realm = await db.getConnection();
    const objects = realm.objects<T>(schema).snapshot();
    return Array.from(objects);
  }

  async getAllObjectsWithOmit<T>(
    schema: string,
    omits: string[],
  ): Promise<T[]> {
    const realm = await db.getConnection();
    const objects = realm.objects<T>(schema).snapshot();
    const result: T[] = [];
    for (const obj of objects) {
      let newObj = {};
      for (const key in obj) {
        if (!omits.includes(key)) {
          (newObj as any)[key] = (obj as any)[key];
        }
      }
      result.push(newObj as T);
    }
    return result;
  }

  async getAllObjectsWithQuery<T>(schema: string, query: string): Promise<T[]> {
    const realm = await db.getConnection();
    const objects = realm.objects<T>(schema).filtered(query).snapshot();
    return Array.from(objects);
  }

  async createObject<T>(schema: string, obj: T) {
    const realm = await db.getConnection();
    realm.write(() => {
      realm.create(schema, obj, Realm.UpdateMode.Modified);
    });
  }

  async createObjects<T>(schema: string, objects: T[]) {
    const realm = await db.getConnection();
    realm.write(() => {
      for (const obj of objects) {
        realm.create(schema, obj, Realm.UpdateMode.Modified);
      }
    });
  }

  async updateFields<T>(
    schema: string,
    id: number,
    fields: string[],
    values: any[],
  ) {
    const realm = await db.getConnection();
    const obj = realm.objectForPrimaryKey<T>(schema, id);
    realm.write(() => {
      if (obj) {
        fields.forEach((field, index) => {
          (obj as any)[field] = values[index];
        });
      }
    });
  }

  async addElementToFields<T extends {id: number}>(
    schema: string,
    id: number,
    fields: string[],
    values: any[],
  ) {
    const realm = await db.getConnection();
    const obj = realm.objectForPrimaryKey<T>(schema, id);
    if (!obj) {
      return;
    }
    const item = obj;
    realm.write(() => {
      if (item) {
        fields.forEach((fieldName, index) => {
          let value = values[index];
          let field = (item as any)[fieldName];
          const findIndex = field.findIndex(
            (el: T) =>
              el === value ||
              (el.id !== undefined &&
                value.id !== undefined &&
                el.id === value.id),
          );
          if (findIndex === -1) {
            field.push(value);
          } else {
            field[findIndex] = value;
          }
        });
      }
    });
  }

  async removeElementFromFields<
    T extends {id: number; searched_item_id: number},
  >(schema: string, id: number, fields: string[], values: any[]) {
    const realm = await db.getConnection();
    const obj = realm.objectForPrimaryKey<T>(schema, id);
    if (!obj) {
      return;
    }
    const item = obj;
    realm.write(() => {
      if (item) {
        fields.forEach((fieldName, index) => {
          const value = values[index];
          let field = (item as any)[fieldName];
          const findIndex = field.findIndex(
            (el: T) =>
              el === value ||
              (el.id !== undefined &&
                value.id !== undefined &&
                el.id === value.id) ||
              (el.searched_item_id !== undefined &&
                value.searched_item_id !== undefined &&
                el.searched_item_id === value.searched_item_id),
          );
          if (findIndex !== -1) {
            field.splice(findIndex, 1);
          }
        });
      }
    });
  }

  async deleteAll() {
    const realm = await db.getConnection();
    realm.deleteAll();
  }
}

export default new BaseDao();
