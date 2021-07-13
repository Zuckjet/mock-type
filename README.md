### ts-mock

a tool to create mock data from typescript interfaces, inspired by [intermock](https://github.com/google/intermock)

Since intermock is not active, and don't support some important features like:

1. don't support nested type literal
```
interface Student {
  name: string,
  grade: {
    math: number,
    english: number
  }
}
```
2. don't support array consist of primitive data
```
interface Group {
  memebers: Array<string>
}
```
3. don't support multiple files
```
interface Admin {
  role: User // User interface located in another file
}
```


### Usage

```
npm run build

cd lib

node index.js -f ../model.ts --interfaces "Admin" 
```


### TODO
* publish to npm as a cli tool
* support multiple files
* automatically scan directory, then write all mock data in files
