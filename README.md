### mock-type

a tool to create mock data from typescript interfaces, inspired by [intermock](https://github.com/google/intermock)


## Installation

```
npm install --global mock-type
```

## Usage

Suppose we have a file named `model.ts` under current directory, which content is like:
```
interface User {
  name: string
}
```

we can mock data by this:
```
mock-type -f ./model.ts --interfaces "User"
```


If you want to write mock data to file, just add outFile option:
```
mock-type -f ./model.ts --interfaces "User" --outFile "./mock.ts"
```


## Why
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

