import { User } from './user';

interface Admin {
  basicString: string;
  basicNumber: number;
  typeReference: Record;
  importedTypeReference: User;
  basicArray: number[];
  referenceArray: User[];
  basicArrayKeyword: Array<number>;
  referenceArrayKeyword: Array<User>;
  basicUnion: string | number;
  referenceUnion: User | Record;
  objectLiteral: {
    type: string;
  };
  stringLiteral: 'a' | 'b';
  basicTypeAlias: StringAlias;
  objectTypeAlias: Grade;
  enum: Direction;
  intersectionType: User & Record;
}

export interface Record {
  title: string;
}

type Grade = {
  average: number;
};

type StringAlias = string;

enum Direction {
  Up = 1,
  Down,
  Left,
  Right
}