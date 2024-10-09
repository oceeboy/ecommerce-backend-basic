import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from './dto/signup.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}
  /**
   * Sign up a new user
   * Checks if the user already exists to avoid duplicates
   */
  async signup(signupDto: SignupDto): Promise<any> {
    const { username, email, password } = signupDto;
    const userExists = await this.userModel.findOne({ email });

    if (userExists) {
      throw new BadRequestException('User already exists');
    }

    const hashedpassword = await bcrypt.hash(password, 10);

    const user = new this.userModel({
      username,
      email,
      password: hashedpassword,
    });

    await user.save();

    return this.createToken(user._id.toString(), user.username);
  }

  /**
   * Login an existing user
   * Throws an exception if the user is not found or credentials are invalid
   */

  async login(loginDto: LoginDto): Promise<any> {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createToken(user._id.toString(), user.username);
  }

  private createToken(userId: string, username: string) {
    const payload = { sub: userId, username };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
  //

  /**
   *  Fetch all users from the database
   *  Returns an array of user objects with password hashed
   *  When making use of this comment out for production as it's for testing alone
   */

  async getall(): Promise<User[]> {
    return await this.userModel.find().exec();
  }
}
