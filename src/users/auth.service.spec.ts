import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    //Create a fake copy of the users service
    const users: User[] = [];
    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 999999),
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('asdf@gmail.com', 'mypassword');
    expect(user.password).not.toEqual('asdff');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use', async () => {
    await service.signup('asdf@gmail.com', 'mypassword');
    try {
      await service.signup('asdf@gmail.com', 'mypassword');
    } catch (err) {
      expect(err.status).toBe(400);
    }
  });

  it('throws an error if sigin is called with an unused email', async () => {
    try {
      await service.signin('asdfo@gmail.com', 'butw09');
    } catch (err) {
      expect(err.status).toBe(404);
    }
  });

  it('throws if an invalid password is provided', async () => {
    await service.signup('does@gmail.com', 'mypassword1');
    try {
      await service.signin('does@gmail.com', 'mypassword');
    } catch (err) {
      expect(err.status).toBe(400);
    }
  });

  it('returns a user if correct password is provided', async () => {
    await service.signup('asdf@gmail.com', 'mypassword');
    const user = await service.signin('asdf@gmail.com', 'mypassword');
    expect(user).toBeDefined();
  });
});
